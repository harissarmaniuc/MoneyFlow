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
    for (const user of users) {
      await checkBillNotifications(user.id);
      await checkSubscriptionNotifications(user.id);
      await checkBirthdayNotifications(user.id);
    }
    return NextResponse.json({ success: true, processedUsers: users.length });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
