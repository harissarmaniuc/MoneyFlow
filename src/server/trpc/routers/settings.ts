import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";

const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  timezone: z.string().min(1).max(100),
});

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        currency: true,
        timezone: true,
      },
    });
  }),

  update: protectedProcedure
    .input(settingsSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          currency: true,
          timezone: true,
        },
      });
    }),
});
