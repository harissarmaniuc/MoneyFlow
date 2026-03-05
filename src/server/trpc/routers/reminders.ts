import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { ReminderCategory, Recurrence } from "@prisma/client";

const reminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(ReminderCategory).default("CUSTOM"),
  dueAt: z.date(),
  recurrence: z.nativeEnum(Recurrence).optional(),
  completed: z.boolean().default(false),
});

export const remindersRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.reminder.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { dueAt: "asc" },
    });
  }),

  getUpcoming: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const end = new Date();
      end.setDate(end.getDate() + input.days);
      return ctx.prisma.reminder.findMany({
        where: {
          userId: ctx.session.user.id,
          completed: false,
          dueAt: { lte: end },
        },
        orderBy: { dueAt: "asc" },
      });
    }),

  create: protectedProcedure
    .input(reminderSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reminder.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: reminderSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reminder.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reminder.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reminder.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { completed: true },
      });
    }),
});
