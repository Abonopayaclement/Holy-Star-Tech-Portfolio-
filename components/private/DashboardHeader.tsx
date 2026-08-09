import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Clock, Globe, Mail, Menu, MessageSquare, ShieldCheck, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { siteConfig } from "@/config/site";
import { getDashboardNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/actions/notifications";

interface DashboardHeaderProps {
  title: string;
  onOpenMobileSidebar: () => void;
}

export function DashboardHeader({
  title,
  onOpenMobileSidebar,
}: DashboardHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await getDashboardNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, targetUrl?: string) => {
    await markNotificationAsRead(id);
    loadNotifications();
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    loadNotifications();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Open Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-extrabold text-foreground sm:text-xl tracking-tight">
            {title}
          </h1>
          <p className="hidden text-[10px] font-mono text-muted-foreground sm:block">
            Holy Star Tech Control Center
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="relative flex items-center gap-3">
        {/* Admin Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-mono font-medium text-indigo-500 md:flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{siteConfig.author}</span>
        </div>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground min-h-[36px]"
          aria-label="View Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* NOTIFICATIONS DROPDOWN DRAWER */}
        {notificationsOpen && (
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl border border-border/80 bg-card p-4 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-500">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-500 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.targetUrl)}
                    className={`group cursor-pointer rounded-2xl border p-3 space-y-1 text-xs transition-all hover:border-indigo-500/50 ${
                      !n.isRead
                        ? "border-amber-500/40 bg-amber-500/10 text-foreground"
                        : "border-border/60 bg-background/80 text-muted-foreground opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground font-sans">
                  No notifications recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Theme Switcher */}
        <ThemeToggle />
      </div>
    </header>
  );
}

function formatTimeAgo(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}
