import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";

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
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const contacts = await ctx.prisma.contact.findMany({
        where: { userId: ctx.session.user.id },
        include: { gifts: true },
      });
      const now = new Date();
      const upcoming = contacts.filter((c) => {
        const bday = new Date(c.birthday);
        const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
        const nextYear = new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());
        const diff = thisYear >= now
          ? (thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          : (nextYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= input.days;
      });
      return upcoming.sort((a, b) => {
        const aDate = new Date(now.getFullYear(), new Date(a.birthday).getMonth(), new Date(a.birthday).getDate());
        const bDate = new Date(now.getFullYear(), new Date(b.birthday).getMonth(), new Date(b.birthday).getDate());
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
