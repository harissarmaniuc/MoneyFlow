import { prisma } from "@/lib/prisma";
import { getNextBirthdayDate, getNextDueDate } from "@/lib/utils";
import { format } from "date-fns";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type = "info",
  linkTo?: string,
  dedupeKey?: string
) {
  if (dedupeKey) {
    return prisma.notification.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: { title, message, type, linkTo, read: false },
      create: { userId, title, message, type, linkTo, dedupeKey },
    });
  }

  return prisma.notification.create({
    data: { userId, title, message, type, linkTo },
  });
}

export async function checkBillNotifications(userId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const bills = await prisma.bill.findMany({ where: { userId } });

  await Promise.all(
    bills.map(async (bill) => {
      const dueDate = getNextDueDate(bill.dueDay, now);
      if (dueDate <= threeDaysFromNow) {
        const dueDateKey = format(dueDate, "yyyy-MM-dd");
        await createNotification(
          userId,
          `Bill Due Soon: ${bill.name}`,
          `Your ${bill.name} bill of $${bill.amount.toFixed(2)} is due on ${format(dueDate, "MMM d")}`,
          "warning",
          "/bills",
          `bill:${bill.id}:${dueDateKey}`
        );
      }
    })
  );
}

export async function checkSubscriptionNotifications(userId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, active: true },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      if (sub.nextBillingAt <= threeDaysFromNow) {
        const nextBillingKey = format(sub.nextBillingAt, "yyyy-MM-dd");
        await createNotification(
          userId,
          `Subscription Renewal: ${sub.name}`,
          `Your ${sub.name} subscription of $${sub.amount.toFixed(2)} renews on ${format(sub.nextBillingAt, "MMM d")}`,
          "info",
          "/subscriptions",
          `subscription:${sub.id}:${nextBillingKey}`
        );
      }
    })
  );
}

export async function checkBirthdayNotifications(userId: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const contacts = await prisma.contact.findMany({ where: { userId } });

  await Promise.all(
    contacts.map(async (contact) => {
      const targetDate = getNextBirthdayDate(contact.birthday, now);
      if (targetDate <= sevenDaysFromNow) {
        const dateKey = format(targetDate, "yyyy-MM-dd");
        await createNotification(
          userId,
          `Birthday Coming Up: ${contact.name}`,
          `${contact.name}'s birthday is on ${format(targetDate, "MMMM d")}`,
          "info",
          "/birthdays",
          `birthday:${contact.id}:${dateKey}`
        );
      }
    })
  );
}
