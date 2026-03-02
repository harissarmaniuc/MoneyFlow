"use client";

import { trpc } from "@/lib/trpc";

export function useNotifications() {
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.getAll.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.notifications.getAll.invalidate(),
        utils.notifications.getUnread.invalidate(),
      ]);
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.notifications.getAll.invalidate(),
        utils.notifications.getUnread.invalidate(),
      ]);
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, isLoading, unreadCount, markRead, markAllRead };
}
