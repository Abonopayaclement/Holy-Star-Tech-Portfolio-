"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Compass,
  Download,
  Eye,
  Globe,
  Laptop,
  Monitor,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Tablet,
  Trash2,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { clearVisitorLogs, getVisitorAnalytics } from "@/actions/analytics";

export default function VisitorsAnalyticsPage() {
  const [data, setData] = useState<{
    totalVisitors: number;
    todayVisitors: number;
    weekVisitors: number;
    monthVisitors: number;
    uniqueVisitors: number;
    mostViewedPage: string;
    topPagesMap: Record<string, number>;
    deviceMap: Record<string, number>;
    recentLogs: {
      id: string;
      createdAt: string;
      path: string;
      device: string;
      browser: string;
      os: string;
      referrer: string;
      visitorId: string;
    }[];
  }>({
    totalVisitors: 0,
    todayVisitors: 0,
    weekVisitors: 0,
    monthVisitors: 0,
    uniqueVisitors: 0,
    mostViewedPage: "/",
    topPagesMap: {},
    deviceMap: {},
    recentLogs: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getVisitorAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to load visitor analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear all visitor analytics logs? Analytics will reset to 0 and recalculate incrementally from live website traffic.")) {
      setLoading(true);
      try {
        await clearVisitorLogs();
        toast.success("Visitor logs cleared. Analytics reset to 0!");
        await loadData();
      } catch (e) {
        toast.error("Failed to clear logs.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = data.recentLogs.filter((log) => {
    const matchesSearch =
      log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.referrer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = deviceFilter === "ALL" || log.device.toUpperCase() === deviceFilter.toUpperCase();

    return matchesSearch && matchesDevice;
  });

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4 text-amber-500" />;
      case "tablet":
        return <Tablet className="h-4 w-4 text-cyan-500" />;
      default:
        return <Monitor className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <AdminLayout title="Visitor Analytics">
      <div className="space-y-8">
        {/* HEADER SECTION & REFRESH / CLEAR ACTIONS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
              <Shield className="h-4 w-4" /> Privacy-First Visitor Tracking
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Traffic & Visitor Analytics</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor public website traffic, top pages, referral sources, and visitor device breakdowns in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500 shadow-sm transition-transform active:scale-95 hover:bg-rose-500/20 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
              Clear & Reset Logs
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-transform active:scale-95 hover:bg-accent/40 min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
              Refresh Analytics
            </button>
          </div>
        </div>

        {/* SUMMARY STAT CARDS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Visitors */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Visitors</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground">
              {loading ? "..." : data.totalVisitors.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>Unique Visitors</span>
              <span className="font-bold text-indigo-500">{data.uniqueVisitors.toLocaleString()}</span>
            </div>
          </div>

          {/* Today's Visitors */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Visits</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground">
              {loading ? "..." : data.todayVisitors.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>This Week</span>
              <span className="font-bold text-emerald-500">{data.weekVisitors.toLocaleString()}</span>
            </div>
          </div>

          {/* This Month */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground">
              {loading ? "..." : data.monthVisitors.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>Monthly Target</span>
              <span className="font-bold text-amber-500">Active</span>
            </div>
          </div>

          {/* Most Viewed Page */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Destination</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <Globe className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-foreground truncate font-mono">
              {loading ? "..." : data.mostViewedPage}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>Top Route</span>
              <span className="font-bold text-cyan-500">Homepage</span>
            </div>
          </div>
        </div>

        {/* TOP PAGES & DEVICE BREAKDOWN ROW */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Top Visited Pages */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-500" /> Most Visited Pages
            </h3>

            <div className="space-y-3">
              {Object.entries(data.topPagesMap).length > 0 ? (
                Object.entries(data.topPagesMap).map(([path, count]) => {
                  const percent = Math.round((count / (data.totalVisitors || 1)) * 100) || 15;
                  return (
                    <div key={path} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-mono text-foreground">{path}</span>
                        <span className="text-muted-foreground">{count} visits ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-accent/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(12, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">No page visits recorded yet.</div>
              )}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Laptop className="h-4 w-4 text-amber-500" /> Device Distribution
            </h3>

            <div className="space-y-4 pt-2">
              {[
                { name: "Desktop", key: "Desktop", icon: Monitor, color: "bg-indigo-500 text-indigo-500" },
                { name: "Mobile", key: "Mobile", icon: Smartphone, color: "bg-amber-500 text-amber-500" },
                { name: "Tablet", key: "Tablet", icon: Tablet, color: "bg-cyan-500 text-cyan-500" },
              ].map((item) => {
                const count = data.deviceMap[item.key] || 0;
                const total = Object.values(data.deviceMap).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const Icon = item.icon;

                return (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-border/60 bg-accent/20 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border/60">
                        <Icon className={`h-4 w-4 ${item.color.split(" ")[1]}`} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground">{count} visits</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RECENT VISITOR LOGS TABLE */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Visitor Activity Logs</h3>
              <p className="text-xs text-muted-foreground">Privacy-conscious real-time traffic audit trail</p>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter page or browser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                />
              </div>

              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
              >
                <option value="ALL">All Devices</option>
                <option value="DESKTOP">Desktop</option>
                <option value="MOBILE">Mobile</option>
                <option value="TABLET">Tablet</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-accent/40 text-muted-foreground font-semibold border-b border-border/60 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Visited Page</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Browser</th>
                  <th className="px-4 py-3">Operating System</th>
                  <th className="px-4 py-3">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-[11px]">
                        {tryFormatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-500 whitespace-nowrap">
                        {log.path}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px]">
                          {getDeviceIcon(log.device)}
                          <span>{log.device}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {log.browser}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {log.os}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-[11px]">
                        {log.referrer}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans text-xs">
                      No matching visitor activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function tryFormatDate(dateStr: string) {
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
