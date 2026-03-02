import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { DebtType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { roundMoney } from "../money";

const debtSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(DebtType),
  originalBalance: z.number().positive().transform(roundMoney),
  currentBalance: z.number().min(0).transform(roundMoney),
  interestRate: z.number().min(0),
  minimumPayment: z.number().positive().transform(roundMoney),
  dueDay: z.number().min(1).max(31).optional(),
  startDate: z.date(),
});

export const debtsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.debt.findMany({
      where: { userId: ctx.session.user.id },
      include: { payments: { orderBy: { paidAt: "desc" }, take: 5 } },
      orderBy: { currentBalance: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.debt.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { payments: { orderBy: { paidAt: "desc" } } },
      });
    }),

  create: protectedProcedure
    .input(debtSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.debt.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: debtSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.debt.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.debt.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  addPayment: protectedProcedure
    .input(z.object({ debtId: z.string(), amount: z.number().positive().transform(roundMoney), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const debt = await ctx.prisma.debt.findFirst({
        where: { id: input.debtId, userId: ctx.session.user.id },
      });
      if (!debt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Debt not found" });
      }
      if (input.amount > debt.currentBalance * 10) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount is unusually high" });
      }
      const [payment] = await ctx.prisma.$transaction([
        ctx.prisma.debtPayment.create({
          data: { debtId: input.debtId, amount: input.amount, paidAt: new Date(), note: input.note },
        }),
        ctx.prisma.debt.update({
          where: { id: input.debtId, userId: ctx.session.user.id },
          data: { currentBalance: Math.max(0, debt.currentBalance - input.amount) },
        }),
      ]);
      return payment;
    }),
});
