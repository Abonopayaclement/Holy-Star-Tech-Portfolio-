"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Heart,
  Mail,
  MessageSquare,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  getAllNotificationsAdmin,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/actions/notifications";

type NotificationFilter = "ALL" | "UNREAD" | "READ";

type NotificationsData = {
  totalCount: number;
  unreadCount: number;
  readCount: number;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: "COMMENT" | "LIKE" | "CONTACT" | "SYSTEM" | string;
    targetUrl: string;
    isRead: boolean;
    createdAt: string;
  }[];
};

export default function PrivateNotificationsPage() {
  const [data, setData] = useState<NotificationsData>({
    totalCount: 0,
    unreadCount: 0,
    readCount: 0,
    notifications: [],
  });

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("ALL");

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getAllNotificationsAdmin(filter);
      setData(res as unknown as NotificationsData);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      toast.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      toast.success("Notification marked as read.");
      loadNotifications();
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success("All notifications marked as read!");
      loadNotifications();
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted.");
      loadNotifications();
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete all notifications?")) {
      try {
        await clearAllNotifications();
        toast.success("All notifications cleared!");
        loadNotifications();
      } catch {
        toast.error("Failed to clear notifications.");
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />;
      case "CONTACT":
        return <Mail className="h-4 w-4 text-cyan-400" />;
      case "COMMENT":
      default:
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <AdminLayout title="Notification Center">
      <div className="space-y-8 pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
              <Bell className="h-4 w-4" /> Activity Notifications
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Admin Notifications & Alerts
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track likes, pending comments, visitor inquiries, and system notifications in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-400 shadow-sm transition-transform active:scale-95 hover:bg-indigo-500/20 min-h-[44px]"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark All as Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              disabled={loading || data.totalCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500 shadow-sm transition-transform active:scale-95 hover:bg-rose-500/20 min-h-[44px] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-transform active:scale-95 hover:bg-accent/40 min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Notifications</span>
            <div className="text-xl font-extrabold font-mono text-foreground">{data.totalCount}</div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Unread Notifications</span>
            <div className="text-xl font-extrabold font-mono text-amber-500">{data.unreadCount}</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Read Notifications</span>
            <div className="text-xl font-extrabold font-mono text-emerald-400">{data.readCount}</div>
          </div>
        </div>

        {/* FILTER BAR: ALL | UNREAD | READ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter Notifications:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-background p-1 rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                filter === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              All Notifications ({data.totalCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                filter === "UNREAD"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              Unread ({data.unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("READ")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                filter === "READ"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              Read ({data.readCount})
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-muted-foreground">
            Loading notifications...
          </div>
        ) : data.notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center text-xs text-muted-foreground">
            No {filter !== "ALL" ? filter.toLowerCase() : ""} notifications found.
          </div>
        ) : (
          <div className="space-y-3">
            {data.notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-3xl border p-5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !n.isRead
                    ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70"
                    : "border-border/80 bg-card/60 opacity-90"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl border border-border/60 bg-background shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                      {!n.isRead ? (
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-500">
                          Unread
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                          Read
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    <p className="text-[11px] font-mono text-muted-foreground/70 pt-1">
                      {new Date(n.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Link
                    href={n.targetUrl || "/private"}
                    onClick={() => {
                      if (!n.isRead) handleMarkAsRead(n.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all min-h-[38px]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Destination</span>
                  </Link>

                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all min-h-[38px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
