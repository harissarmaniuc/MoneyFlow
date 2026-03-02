import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { userId: ctx.session.user.id, read: false },
      orderBy: { createdAt: "desc" },
    });
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { read: true },
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id, read: false },
      data: { read: true },
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
