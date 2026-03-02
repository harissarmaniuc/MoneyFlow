import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
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
      return ctx.prisma.expense.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: expenseSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
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
