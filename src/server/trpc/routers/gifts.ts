import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { TRPCError } from "@trpc/server";
import { roundMoney } from "../money";

const giftSchema = z.object({
  contactId: z.string(),
  name: z.string().min(1),
  budget: z.number().positive().transform(roundMoney).optional(),
  purchased: z.boolean().default(false),
  year: z.number().int(),
  notes: z.string().optional(),
});

export const giftsRouter = createTRPCRouter({
  getByContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findFirst({
        where: { id: input.contactId, userId: ctx.session.user.id },
      });
      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return ctx.prisma.gift.findMany({
        where: { contactId: input.contactId },
        orderBy: { year: "desc" },
      });
    }),

  create: protectedProcedure
    .input(giftSchema)
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findFirst({
        where: { id: input.contactId, userId: ctx.session.user.id },
      });
      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return ctx.prisma.gift.create({ data: input });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: giftSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const gift = await ctx.prisma.gift.findFirst({
        where: { id: input.id, contact: { userId: ctx.session.user.id } },
      });
      if (!gift) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Gift not found" });
      }
      if (input.data.contactId) {
        const nextContact = await ctx.prisma.contact.findFirst({
          where: { id: input.data.contactId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!nextContact) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid contact" });
        }
      }
      return ctx.prisma.gift.update({ where: { id: input.id }, data: input.data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gift = await ctx.prisma.gift.findFirst({
        where: { id: input.id, contact: { userId: ctx.session.user.id } },
      });
      if (!gift) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Gift not found" });
      }
      return ctx.prisma.gift.delete({ where: { id: input.id } });
    }),

  markPurchased: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gift = await ctx.prisma.gift.findFirst({
        where: { id: input.id, contact: { userId: ctx.session.user.id } },
      });
      if (!gift) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Gift not found" });
      }
      return ctx.prisma.gift.update({ where: { id: input.id }, data: { purchased: true } });
    }),
});
