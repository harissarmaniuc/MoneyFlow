import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { MaintenanceType } from "@prisma/client";

const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).default(0),
  licensePlate: z.string().optional(),
});

const maintenanceSchema = z.object({
  vehicleId: z.string(),
  type: z.nativeEnum(MaintenanceType),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  performedAt: z.date().optional(),
  nextDueAt: z.date().optional(),
  nextDueMiles: z.number().int().optional(),
  completed: z.boolean().default(false),
});

export const vehiclesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vehicle.findMany({
      where: { userId: ctx.session.user.id },
      include: { records: { orderBy: { performedAt: "desc" } } },
    });
  }),

  create: protectedProcedure
    .input(vehicleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vehicle.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: vehicleSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vehicle.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vehicle.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  addMaintenance: protectedProcedure
    .input(maintenanceSchema)
    .mutation(async ({ ctx, input }) => {
      const vehicle = await ctx.prisma.vehicle.findFirst({
        where: { id: input.vehicleId, userId: ctx.session.user.id },
      });
      if (!vehicle) throw new Error("Vehicle not found");
      return ctx.prisma.maintenanceRecord.create({ data: input });
    }),

  updateMaintenance: protectedProcedure
    .input(z.object({ id: z.string(), data: maintenanceSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.maintenanceRecord.findFirst({
        where: { id: input.id, vehicle: { userId: ctx.session.user.id } },
      });
      if (!record) throw new Error("Maintenance record not found");
      return ctx.prisma.maintenanceRecord.update({ where: { id: input.id }, data: input.data });
    }),

  deleteMaintenance: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.maintenanceRecord.findFirst({
        where: { id: input.id, vehicle: { userId: ctx.session.user.id } },
      });
      if (!record) throw new Error("Maintenance record not found");
      return ctx.prisma.maintenanceRecord.delete({ where: { id: input.id } });
    }),
});
