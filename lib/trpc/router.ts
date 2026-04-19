import { createTRPCRouter } from "./init";
import { familyRouter } from "./routers/family";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  family: familyRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
