import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  familyProcedure,
} from "@/lib/trpc/init";
import { families, users, auditLog } from "@/lib/db/schema";
import { TRPCError } from "@trpc/server";

export const familyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.familyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bereits Mitglied einer Familie",
        });
      }

      const [family] = await ctx.db
        .insert(families)
        .values({ name: input.name })
        .returning();

      await ctx.db
        .update(users)
        .set({ familyId: family.id, role: "parent" })
        .where(eq(users.id, ctx.user.id));

      await ctx.db.insert(auditLog).values({
        familyId: family.id,
        userId: ctx.user.id,
        entity: "family",
        entityId: family.id,
        action: "create",
        diff: { name: input.name },
      });

      return family;
    }),

  get: familyProcedure.query(async ({ ctx }) => {
    const family = await ctx.db.query.families.findFirst({
      where: eq(families.id, ctx.familyId),
    });
    if (!family) throw new TRPCError({ code: "NOT_FOUND" });
    return family;
  }),

  update: familyProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const [family] = await ctx.db
        .update(families)
        .set({ name: input.name })
        .where(eq(families.id, ctx.familyId))
        .returning();

      await ctx.db.insert(auditLog).values({
        familyId: ctx.familyId,
        userId: ctx.user.id,
        entity: "family",
        entityId: ctx.familyId,
        action: "update",
        diff: input,
      });

      return family;
    }),

  members: familyProcedure.query(async ({ ctx }) => {
    return ctx.db.query.users.findMany({
      where: eq(users.familyId, ctx.familyId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        birthdate: true,
        avatar: true,
        createdAt: true,
      },
    });
  }),

  removeMember: familyProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (caller?.role !== "parent") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kannst dich nicht selbst entfernen",
        });
      }

      await ctx.db
        .update(users)
        .set({ familyId: null })
        .where(
          and(
            eq(users.id, input.userId),
            eq(users.familyId, ctx.familyId)
          )
        );

      await ctx.db.insert(auditLog).values({
        familyId: ctx.familyId,
        userId: ctx.user.id,
        entity: "user",
        entityId: input.userId,
        action: "remove",
      });
    }),
});
