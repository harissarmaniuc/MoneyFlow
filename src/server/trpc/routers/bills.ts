import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { BillCategory, Recurrence } from "@prisma/client";

const billSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(BillCategory),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  dueDay: z.number().min(1).max(31),
  recurrence: z.nativeEnum(Recurrence).default("MONTHLY"),
  autoPay: z.boolean().default(false),
  notes: z.string().optional(),
});

export const billsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.bill.findMany({
      where: { userId: ctx.session.user.id },
      include: { payments: { orderBy: { paidAt: "desc" }, take: 1 } },
      orderBy: { dueDay: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.bill.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { payments: { orderBy: { paidAt: "desc" } } },
      });
    }),

  create: protectedProcedure
    .input(billSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bill.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: billSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bill.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bill.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  markPaid: protectedProcedure
    .input(z.object({ billId: z.string(), amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const bill = await ctx.prisma.bill.findFirst({
        where: { id: input.billId, userId: ctx.session.user.id },
      });
      if (!bill) throw new Error("Bill not found");
      return ctx.prisma.billPayment.create({
        data: { billId: input.billId, amount: input.amount, paidAt: new Date(), status: "PAID" },
      });
    }),
});
