import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type = "info",
  linkTo?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, type, linkTo },
  });
}

export async function checkBillNotifications(userId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const bills = await prisma.bill.findMany({ where: { userId } });

  for (const bill of bills) {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

    if (dueDate <= threeDaysFromNow) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title: { contains: bill.name },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });
      if (!existing) {
        await createNotification(
          userId,
          `Bill Due Soon: ${bill.name}`,
          `Your ${bill.name} bill of $${bill.amount} is due on day ${bill.dueDay}`,
          "warning",
          "/bills"
        );
      }
    }
  }
}

export async function checkSubscriptionNotifications(userId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, active: true },
  });

  for (const sub of subscriptions) {
    if (sub.nextBillingAt <= threeDaysFromNow) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title: { contains: sub.name },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });
      if (!existing) {
        await createNotification(
          userId,
          `Subscription Renewal: ${sub.name}`,
          `Your ${sub.name} subscription of $${sub.amount} renews soon`,
          "info",
          "/subscriptions"
        );
      }
    }
  }
}

export async function checkBirthdayNotifications(userId: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const contacts = await prisma.contact.findMany({ where: { userId } });

  for (const contact of contacts) {
    const bday = new Date(contact.birthday);
    const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
    const targetDate = thisYearBday >= now ? thisYearBday : new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());

    if (targetDate <= sevenDaysFromNow) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title: { contains: contact.name },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });
      if (!existing) {
        await createNotification(
          userId,
          `Birthday Coming Up: ${contact.name}`,
          `${contact.name}'s birthday is on ${bday.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
          "info",
          "/birthdays"
        );
      }
    }
  }
}
