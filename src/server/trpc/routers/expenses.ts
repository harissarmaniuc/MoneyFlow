import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { TRPCError } from "@trpc/server";
import { roundMoney } from "../money";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive().transform(roundMoney),
  date: z.date(),
  budgetCategoryId: z.string().optional(),
});

export const expensesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.expense.findMany({
      where: { userId: ctx.session.user.id },
      include: { budgetCategory: true },
      orderBy: { date: "desc" },
    });
  }),

  getByDateRange: protectedProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.expense.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: input.start, lte: input.end },
        },
        include: { budgetCategory: true },
        orderBy: { date: "desc" },
      });
    }),

  create: protectedProcedure
    .input(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.budgetCategoryId) {
        const category = await ctx.prisma.budgetCategory.findFirst({
          where: { id: input.budgetCategoryId, budget: { userId: ctx.session.user.id } },
          select: { id: true },
        });
        if (!category) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid budget category" });
        }
      }

      return ctx.prisma.expense.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  createMany: protectedProcedure
    .input(z.object({ items: z.array(expenseSchema).min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const categoryIds = [...new Set(input.items.map((item) => item.budgetCategoryId).filter(Boolean))] as string[];
      if (categoryIds.length > 0) {
        const owned = await ctx.prisma.budgetCategory.findMany({
          where: { id: { in: categoryIds }, budget: { userId: ctx.session.user.id } },
          select: { id: true },
        });
        if (owned.length !== categoryIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One or more categories are invalid" });
        }
      }

      const created = await ctx.prisma.expense.createMany({
        data: input.items.map((item) => ({ ...item, userId: ctx.session.user.id })),
      });
      return { count: created.count };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: expenseSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      if (input.data.budgetCategoryId) {
        const category = await ctx.prisma.budgetCategory.findFirst({
          where: { id: input.data.budgetCategoryId, budget: { userId: ctx.session.user.id } },
          select: { id: true },
        });
        if (!category) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid budget category" });
        }
      }

      return ctx.prisma.expense.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
