import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { SubCategory, Recurrence } from "@prisma/client";

const subscriptionSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(SubCategory),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  billingCycle: z.nativeEnum(Recurrence).default("MONTHLY"),
  nextBillingAt: z.date(),
  isFreeTrial: z.boolean().default(false),
  trialEndsAt: z.date().optional(),
  active: z.boolean().default(true),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const subscriptionsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { nextBillingAt: "asc" },
    });
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findMany({
      where: { userId: ctx.session.user.id, active: true },
      orderBy: { nextBillingAt: "asc" },
    });
  }),

  create: protectedProcedure
    .input(subscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.subscription.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: subscriptionSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.subscription.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.subscription.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.subscription.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { active: false },
      });
    }),
});
