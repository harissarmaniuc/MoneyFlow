import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkBillNotifications,
  checkSubscriptionNotifications,
  checkBirthdayNotifications,
} from "@/server/services/notification.service";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const concurrency = 20;
    let processed = 0;

    for (let i = 0; i < users.length; i += concurrency) {
      const batch = users.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(async (user) => {
          await Promise.all([
            checkBillNotifications(user.id),
            checkSubscriptionNotifications(user.id),
            checkBirthdayNotifications(user.id),
          ]);
        })
      );
      processed += batch.length;
    }

    return NextResponse.json({ success: true, processedUsers: processed });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
