import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { BudgetPeriod } from "@prisma/client";

const budgetCategorySchema = z.object({
  name: z.string().min(1),
  allocated: z.number().positive(),
});

const budgetSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  period: z.nativeEnum(BudgetPeriod).default("MONTHLY"),
  startDate: z.date(),
  endDate: z.date().optional(),
  rollover: z.boolean().default(false),
  categories: z.array(budgetCategorySchema).optional(),
});

export const budgetsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.budget.findMany({
      where: { userId: ctx.session.user.id },
      include: { categories: { include: { expenses: true } } },
      orderBy: { startDate: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budget.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { categories: { include: { expenses: true } } },
      });
    }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.prisma.budget.findFirst({
      where: {
        userId: ctx.session.user.id,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { categories: { include: { expenses: true } } },
      orderBy: { startDate: "desc" },
    });
  }),

  create: protectedProcedure
    .input(budgetSchema)
    .mutation(async ({ ctx, input }) => {
      const { categories, ...budgetData } = input;
      return ctx.prisma.budget.create({
        data: {
          ...budgetData,
          userId: ctx.session.user.id,
          categories: categories ? { create: categories } : undefined,
        },
        include: { categories: true },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: budgetSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const { categories, ...budgetData } = input.data;
      return ctx.prisma.budget.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: budgetData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.budget.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
