import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { getNextBirthdayDate } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(1),
  birthday: z.date(),
  relationship: z.string().optional(),
  notes: z.string().optional(),
});

export const contactsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.contact.findMany({
      where: { userId: ctx.session.user.id },
      include: { gifts: true },
      orderBy: { name: "asc" },
    });
  }),

  getUpcoming: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const contacts = await ctx.prisma.contact.findMany({
        where: { userId: ctx.session.user.id },
        include: { gifts: true },
      });
      const now = new Date();
      const upcoming = contacts.filter((c) => {
        const target = getNextBirthdayDate(c.birthday, now);
        const diff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= input.days;
      });
      return upcoming.sort((a, b) => {
        const aDate = getNextBirthdayDate(a.birthday, now);
        const bDate = getNextBirthdayDate(b.birthday, now);
        return aDate.getTime() - bDate.getTime();
      });
    }),

  create: protectedProcedure
    .input(contactSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contact.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: contactSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contact.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contact.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
