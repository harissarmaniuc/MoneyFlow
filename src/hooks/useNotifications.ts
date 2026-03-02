"use client";

import { trpc } from "@/lib/trpc";

export function useNotifications() {
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.getAll.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, isLoading, unreadCount, markRead, markAllRead };
}
