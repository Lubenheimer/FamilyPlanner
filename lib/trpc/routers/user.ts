import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  familyProcedure,
} from "@/lib/trpc/init";
import { users, auditLog } from "@/lib/db/schema";
import { TRPCError } from "@trpc/server";

const MEMBER_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
];

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: {
        id: true,
        familyId: true,
        name: true,
        email: true,
        role: true,
        color: true,
        birthdate: true,
        avatar: true,
        createdAt: true,
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        birthdate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.color && { color: input.color }),
          ...(input.birthdate && { birthdate: input.birthdate }),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),

  addChild: familyProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        birthdate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (caller?.role !== "parent") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existingMembers = await ctx.db.query.users.findMany({
        where: eq(users.familyId, ctx.familyId),
        columns: { color: true },
      });
      const usedColors = existingMembers.map((m) => m.color);
      const color =
        input.color ??
        MEMBER_COLORS.find((c) => !usedColors.includes(c)) ??
        MEMBER_COLORS[0];

      const [child] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          familyId: ctx.familyId,
          role: "child",
          color,
          birthdate: input.birthdate,
        })
        .returning();

      await ctx.db.insert(auditLog).values({
        familyId: ctx.familyId,
        userId: ctx.user.id,
        entity: "user",
        entityId: child.id,
        action: "create",
        diff: { name: input.name, role: "child" },
      });

      return child;
    }),

  updateMember: familyProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1).max(100).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        role: z.enum(["parent", "child"]).optional(),
        birthdate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      const isOwnProfile = input.userId === ctx.user.id;
      if (!isOwnProfile && caller?.role !== "parent") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { userId, ...rest } = input;
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...(rest.name && { name: rest.name }),
          ...(rest.color && { color: rest.color }),
          ...(rest.role && { role: rest.role }),
          ...(rest.birthdate && { birthdate: rest.birthdate }),
        })
        .where(
          and(eq(users.id, userId), eq(users.familyId, ctx.familyId))
        )
        .returning();

      await ctx.db.insert(auditLog).values({
        familyId: ctx.familyId,
        userId: ctx.user.id,
        entity: "user",
        entityId: userId,
        action: "update",
        diff: rest,
      });

      return updated;
    }),

  setPushSubscription: protectedProcedure
    .input(z.object({ subscription: z.record(z.string(), z.unknown()).nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ pushSubscription: input.subscription })
        .where(eq(users.id, ctx.user.id));
    }),
});
