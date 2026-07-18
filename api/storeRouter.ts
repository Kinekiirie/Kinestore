import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, messages, products, stories, users } from "@db/schema";
import { and, desc, eq, gt, like, or } from "drizzle-orm";
import { getBadgesFor, publicUser, requireUser } from "./auth";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        game: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conds = [];
      if (input?.search) {
        conds.push(
          or(like(products.title, `%${input.search}%`), like(products.game, `%${input.search}%`)),
        );
      }
      if (input?.game && input.game !== "Semua") conds.push(eq(products.game, input.game));
      const rows = await db
        .select()
        .from(products)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(100);
      const sellers = await db.select().from(users);
      const sellerMap = new Map(sellers.map((s) => [s.id, s]));
      return rows.map((p) => {
        const s = sellerMap.get(p.sellerId);
        return { ...p, seller: s ? { ...publicUser(s) } : null };
      });
    }),

  games: publicQuery.query(async () => {
    const rows = await getDb().selectDistinct({ game: products.game }).from(products);
    return rows.map((r) => r.game);
  }),

  byId: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [p] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
    if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
    const [seller] = await db.select().from(users).where(eq(users.id, p.sellerId)).limit(1);
    const badges = seller ? await getBadgesFor(seller.id) : [];
    return { ...p, seller: seller ? publicUser(seller) : null, sellerBadges: badges };
  }),

  mine: publicQuery.query(async ({ ctx }) => {
    const user = await requireUser(ctx);
    return getDb().select().from(products).where(eq(products.sellerId, user.id)).orderBy(desc(products.createdAt));
  }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(3).max(200),
        game: z.string().min(2).max(100),
        category: z.string().default("Akun"),
        description: z.string().max(2000).optional(),
        price: z.number().int().min(1000),
        image: z.string().max(8).default("🎯"),
        level: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      const [{ id }] = await getDb().insert(products).values({ ...input, sellerId: user.id }).$returningId();
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).max(200).optional(),
        game: z.string().min(2).max(100).optional(),
        category: z.string().optional(),
        description: z.string().max(2000).optional(),
        price: z.number().int().min(1000).optional(),
        image: z.string().max(8).optional(),
        level: z.string().max(50).optional(),
        status: z.enum(["available", "sold"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      const db = getDb();
      const [p] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (!p || p.sellerId !== user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await db.update(products).set(data).where(eq(products.id, id));
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const user = await requireUser(ctx);
    await getDb().delete(products).where(and(eq(products.id, input.id), eq(products.sellerId, user.id)));
    return { ok: true };
  }),
});

export const userRouter = createRouter({
  profile: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
    const badges = await getBadgesFor(user.id);
    const prods = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, user.id))
      .orderBy(desc(products.createdAt));
    const activeStories = await db
      .select()
      .from(stories)
      .where(and(eq(stories.userId, user.id), gt(stories.expiresAt, new Date())))
      .orderBy(desc(stories.createdAt));
    return { user: publicUser(user), badges, products: prods, stories: activeStories };
  }),

  updateProfile: publicQuery
    .input(
      z.object({
        displayName: z.string().min(2).max(60).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().max(8).optional(),
        phone: z.string().max(32).optional(),
        qrisImage: z.string().optional(),
        qrisNote: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      await getDb().update(users).set(input).where(eq(users.id, user.id));
      return { ok: true };
    }),
});

export const chatRouter = createRouter({
  conversations: publicQuery.query(async ({ ctx }) => {
    const user = await requireUser(ctx);
    const db = getDb();
    const convs = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))
      .orderBy(desc(conversations.createdAt));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const result = [];
    for (const c of convs) {
      const otherId = c.buyerId === user.id ? c.sellerId : c.buyerId;
      const other = userMap.get(otherId);
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, c.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      result.push({
        ...c,
        other: other ? publicUser(other) : null,
        lastMessage: lastMsg ?? null,
      });
    }
    result.sort((a, b) => {
      const ta = a.lastMessage?.createdAt ?? a.createdAt;
      const tb = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
    return result;
  }),

  start: publicQuery
    .input(z.object({ sellerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      if (user.id === input.sellerId) throw new TRPCError({ code: "BAD_REQUEST", message: "Tidak bisa chat diri sendiri" });
      const db = getDb();
      const [existing] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.buyerId, user.id), eq(conversations.sellerId, input.sellerId)))
        .limit(1);
      if (existing) return { id: existing.id };
      const [{ id }] = await db
        .insert(conversations)
        .values({ buyerId: user.id, sellerId: input.sellerId })
        .$returningId();
      return { id };
    }),

  messages: publicQuery
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      const db = getDb();
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv || (conv.buyerId !== user.id && conv.sellerId !== user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt)
        .limit(200);
      const otherId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId;
      const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
      return { messages: msgs, other: other ? publicUser(other) : null, me: user.id };
    }),

  send: publicQuery
    .input(z.object({ conversationId: z.number(), text: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      const db = getDb();
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv || (conv.buyerId !== user.id && conv.sellerId !== user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.insert(messages).values({
        conversationId: input.conversationId,
        senderId: user.id,
        text: input.text,
      });
      return { ok: true };
    }),
});

export const storyRouter = createRouter({
  feed: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    const active = await db
      .select()
      .from(stories)
      .where(gt(stories.expiresAt, new Date()))
      .orderBy(desc(stories.createdAt))
      .limit(200);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const me = ctx.req.headers.get("authorization") ? undefined : undefined;
    void me;
    // group by user
    const grouped = new Map<number, { user: ReturnType<typeof publicUser>; stories: typeof active }>();
    for (const s of active) {
      const u = userMap.get(s.userId);
      if (!u) continue;
      if (!grouped.has(s.userId)) grouped.set(s.userId, { user: publicUser(u), stories: [] });
      grouped.get(s.userId)!.stories.push(s);
    }
    return Array.from(grouped.values());
  }),

  create: publicQuery
    .input(
      z.object({
        text: z.string().min(1).max(280),
        emoji: z.string().max(8).default("🔥"),
        color: z.string().max(32).default("purple"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 jam
      await getDb().insert(stories).values({ ...input, userId: user.id, expiresAt });
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const user = await requireUser(ctx);
    await getDb().delete(stories).where(and(eq(stories.id, input.id), eq(stories.userId, user.id)));
    return { ok: true };
  }),
});
