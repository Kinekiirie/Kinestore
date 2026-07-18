import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./queries/connection";
import { sessions, users, userBadges } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { TrpcContext } from "./context";
import { TRPCError } from "@trpc/server";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await getDb().insert(sessions).values({ token, userId, expiresAt });
  return token;
}

export async function getUserFromCtx(ctx: TrpcContext) {
  const auth = ctx.req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

export async function requireUser(ctx: TrpcContext) {
  const user = await getUserFromCtx(ctx);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" });
  return user;
}

export async function getBadgesFor(userId: number): Promise<string[]> {
  const rows = await getDb().select().from(userBadges).where(eq(userBadges.userId, userId));
  return rows.map((r) => r.badge);
}

export function publicUser(user: typeof users.$inferSelect) {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}
