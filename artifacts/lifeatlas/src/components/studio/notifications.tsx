"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { Popover } from "radix-ui";
import { Bell, BookHeart, Gift, Mail, Package, Download, Info, Hourglass } from "lucide-react";
import { useDb, useUnreadNotifications } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { cn, relativeTime } from "@/lib/utils";

const icons = {
  contribution: BookHeart,
  invitation: Mail,
  order: Package,
  export: Download,
  system: Info,
  future_message: Hourglass,
} as const;

export function NotificationsButton({ className }: { className?: string }) {
  const items = useDb((d) => d.notifications);
  const unread = useUnreadNotifications();
  const mutate = useDemoStore((s) => s.mutate);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={cn("relative grid size-10 place-items-center rounded-full text-ink-2 hover:bg-ivory hover:text-ink", className)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-[19px]" />
          {unread ? <span className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-semibold text-white">{unread}</span> : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-[85] w-[min(380px,calc(100vw-24px))] rounded-[18px] border border-line bg-surface shadow-lg data-[state=open]:animate-[fade-in_160ms_ease-out]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-medium">Notifications</p>
            {unread ? (
              <button
                className="text-[0.8125rem] font-medium text-evergreen hover:underline"
                onClick={() =>
                  mutate((d) => {
                    d.notifications.forEach((n) => (n.read = true));
                  })
                }
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto p-1.5">
            {items.length === 0 ? <li className="px-4 py-8 text-center text-[0.9rem] text-ink-3">Nothing new. When family members add stories, you&rsquo;ll see them here.</li> : null}
            {items.slice(0, 20).map((n) => {
              const Icon = icons[n.kind] ?? Gift;
              const body = (
                <span className="flex gap-3 rounded-[12px] px-2.5 py-2.5 hover:bg-ivory">
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", n.read ? "bg-ivory text-ink-3" : "bg-evergreen-soft text-evergreen")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("text-[0.875rem] leading-snug", n.read ? "text-ink-2" : "font-medium text-ink")}>{n.title}</span>
                      <span className="shrink-0 text-[0.7rem] text-ink-4">{relativeTime(n.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-3">{n.body}</span>
                  </span>
                </span>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() =>
                        mutate((d) => {
                          const x = d.notifications.find((y) => y.id === n.id);
                          if (x) x.read = true;
                        })
                      }
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-[0.75rem] text-ink-4">In-app only. No emails or push notifications are sent in this preview.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
