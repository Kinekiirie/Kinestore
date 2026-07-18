import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./authRouter";
import { chatRouter, productRouter, storyRouter, userRouter } from "./storeRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  product: productRouter,
  user: userRouter,
  chat: chatRouter,
  story: storyRouter,
});

export type AppRouter = typeof appRouter;
