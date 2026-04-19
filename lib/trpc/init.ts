import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  const session = await auth();
  return { db, session };
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const familyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.familyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Noch keine Familie angelegt",
    });
  }
  return next({
    ctx: {
      ...ctx,
      familyId: ctx.session.user.familyId,
    },
  });
});
