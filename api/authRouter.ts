import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { captchas, sessions, userBadges, users } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  createSession,
  getBadgesFor,
  getUserFromCtx,
  hashPassword,
  publicUser,
  requireUser,
  verifyPassword,
} from "./auth";

const CAPTCHA_QUESTIONS: Array<[string, string]> = [
  ["Berapa 7 + 5?", "12"],
  ["Berapa 9 - 4?", "5"],
  ["Berapa 6 x 3?", "18"],
  ["Berapa 15 + 8?", "23"],
  ["Berapa 20 - 7?", "13"],
  ["Berapa 4 x 6?", "24"],
  ["Berapa 11 + 9?", "20"],
  ["Berapa 8 x 7?", "56"],
  ["Berapa 30 - 12?", "18"],
  ["Berapa 5 x 5?", "25"],
];

async function verifyCaptcha(captchaId: number, answer: string, robotChecked: boolean) {
  if (!robotChecked) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Centang dulu 'Saya bukan robot'" });
  }
  const db = getDb();
  const [cap] = await db.select().from(captchas).where(eq(captchas.id, captchaId)).limit(1);
  if (!cap || cap.used) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Kode verifikasi tidak valid, muat ulang captcha" });
  }
  if (cap.answer.trim().toLowerCase() !== answer.trim().toLowerCase()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Jawaban verifikasi salah, coba lagi" });
  }
  await db.update(captchas).set({ used: true }).where(eq(captchas.id, captchaId));
}

export const authRouter = createRouter({
  getCaptcha: publicQuery.query(async () => {
    const [q, a] = CAPTCHA_QUESTIONS[Math.floor(Math.random() * CAPTCHA_QUESTIONS.length)];
    const [{ id }] = await getDb().insert(captchas).values({ question: q, answer: a }).$returningId();
    return { id, question: q };
  }),

  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username hanya huruf/angka/underscore"),
        displayName: z.string().min(2).max(60),
        password: z.string().min(6, "Password minimal 6 karakter"),
        captchaId: z.number(),
        captchaAnswer: z.string(),
        robotChecked: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await verifyCaptcha(input.captchaId, input.captchaAnswer, input.robotChecked);
      const db = getDb();
      const [existing] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username sudah dipakai" });
      const [{ id }] = await db
        .insert(users)
        .values({
          username: input.username,
          displayName: input.displayName,
          passwordHash: hashPassword(input.password),
          avatar: ["🎮", "🕹️", "👾", "🐉", "⚔️", "🏆"][Math.floor(Math.random() * 6)],
        })
        .$returningId();
      await db.insert(userBadges).values({ userId: id, badge: "new" });
      const token = await createSession(id);
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return { token, user: publicUser(user), badges: ["new"] };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        captchaId: z.number(),
        captchaAnswer: z.string(),
        robotChecked: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await verifyCaptcha(input.captchaId, input.captchaAnswer, input.robotChecked);
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Username atau password salah" });
      }
      const token = await createSession(user.id);
      const badges = await getBadgesFor(user.id);
      return { token, user: publicUser(user), badges };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return null;
    const badges = await getBadgesFor(user.id);
    return { user: publicUser(user), badges };
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const user = await requireUser(ctx);
    const auth = ctx.req.headers.get("authorization");
    const token = auth?.slice(7) ?? "";
    await getDb().delete(sessions).where(eq(sessions.token, token));
    return { ok: true, userId: user.id };
  }),
});
