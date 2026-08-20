"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Home,
  Info,
  Mail,
  Plus,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { DashboardCard } from "@/components/private/DashboardCard";
import { getDashboardMetrics } from "@/actions/dashboard";

const publicQuickLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Info },
  { name: "Projects", href: "/projects", icon: FolderGit2 },
  { name: "Blog", href: "/blog", icon: BookOpen },
  { name: "Resume", href: "/resume", icon: FileText },
  { name: "Contact", href: "/contact", icon: Mail },
];

export default function PrivateDashboardHome() {
  const [metrics, setMetrics] = useState<{
    projects: { total: number; featured: number };
    blog: { total: number; published: number };
    visitors: { total: number; today: number };
    messages: { total: number; unread: number };
  }>({
    projects: { total: 0, featured: 0 },
    blog: { total: 0, published: 0 },
    visitors: { total: 0, today: 0 },
    messages: { total: 0, unread: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data as typeof metrics);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-8">
        {/* WELCOME BANNER */}
        <div className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-tr from-background via-indigo-950/10 to-background p-6 sm:p-8 backdrop-blur-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
                <Sparkles className="h-4 w-4" /> Administration Control Center
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Welcome Back, Abonopaya Clement Ayebono
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your projects, publish journal entries, view messages, and update portfolio assets.
              </p>
            </div>

            <Link
              href="/private/blog"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          </div>
        </div>

        {/* OVERVIEW STATS CARDS GRID - DYNAMIC SYSTEM METRICS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Projects Card */}
          <DashboardCard
            title="Projects"
            value={loading ? "..." : metrics.projects.total}
            icon={FolderGit2}
            gradient="from-amber-500/20 via-indigo-600/20 to-cyan-500/20"
            details={[
              { label: "Total Projects", value: metrics.projects.total },
              { label: "Featured", value: metrics.projects.featured, color: "text-amber-500 font-bold" },
            ]}
          />

          {/* Blog Card */}
          <DashboardCard
            title="Blog Posts"
            value={loading ? "..." : metrics.blog.published}
            icon={BookOpen}
            gradient="from-indigo-600/20 via-purple-600/20 to-pink-500/20"
            details={[
              { label: "Published Live", value: metrics.blog.published, color: "text-emerald-500 font-bold" },
              { label: "Total Posts", value: metrics.blog.total },
            ]}
          />

          {/* Visitors Analytics Stat Card */}
          <DashboardCard
            title="Visitors"
            value={loading ? "..." : (metrics.visitors.total ?? 0).toLocaleString()}
            icon={Users}
            gradient="from-emerald-500/20 via-teal-600/20 to-indigo-600/20"
            details={[
              { label: "Total Visits", value: (metrics.visitors.total ?? 0).toLocaleString() },
              { label: "Today's Visits", value: metrics.visitors.today ?? 0, color: "text-emerald-500 font-bold" },
            ]}
          />

          {/* Messages Card */}
          <DashboardCard
            title="Messages & Inquiries"
            value={loading ? "..." : metrics.messages.total}
            icon={Mail}
            gradient="from-cyan-500/20 via-blue-600/20 to-indigo-600/20"
            details={[
              { label: "New Unread", value: metrics.messages.unread, color: "text-amber-500 font-bold" },
              { label: "Total Received", value: metrics.messages.total },
            ]}
          />
        </div>

        {/* MOBILE-FIRST WORKFLOW QUICK ACTIONS */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Quick Management Actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/private/blog"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center text-indigo-600 dark:text-indigo-400 transition-transform active:scale-95 min-h-[80px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-bold">New Article</span>
            </Link>

            <Link
              href="/private/visitors"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-600 dark:text-emerald-400 transition-transform active:scale-95 min-h-[80px]"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs font-bold">Traffic & Visitors</span>
            </Link>

            <Link
              href="/private/projects"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-amber-600 dark:text-amber-400 transition-transform active:scale-95 min-h-[80px]"
            >
              <FolderGit2 className="h-6 w-6" />
              <span className="text-xs font-bold">Add Project</span>
            </Link>

            <Link
              href="/private/profile"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-center text-purple-600 dark:text-purple-400 transition-transform active:scale-95 min-h-[80px]"
            >
              <UserCheck className="h-6 w-6" />
              <span className="text-xs font-bold">Profile & CV</span>
            </Link>
          </div>
        </div>

        {/* PUBLIC WEBSITE QUICK LINKS SECTION */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" />
              <h3 className="text-base font-bold text-foreground">View Public Website</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Live Site Quick Access</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {publicQuickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-accent/20 px-3.5 py-3 text-xs font-semibold text-foreground transition-all hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:text-indigo-500 min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{link.name}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
