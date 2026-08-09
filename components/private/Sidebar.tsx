"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  BookOpen,
  FileEdit,
  FileText,
  FolderGit2,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { signOutAdmin } from "@/actions/admin-auth";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}

export const adminNavItems: AdminNavItem[] = [
  { title: "Dashboard", href: "/private", icon: LayoutDashboard },
  { title: "Visitors", href: "/private/visitors", icon: Users },
  { title: "Engagement", href: "/private/engagement", icon: HeartHandshake },
  { title: "Projects", href: "/private/projects", icon: FolderGit2 },
  { title: "Active Work", href: "/private/active-project", icon: Activity },
  { title: "Blog", href: "/private/blog", icon: BookOpen },
  { title: "Messages", href: "/private/messages", icon: Mail, badge: "New" },
  { title: "Profile", href: "/private/profile", icon: UserCheck },
  { title: "Settings", href: "/private/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    await signOutAdmin();
    toast.success("Administrator signed out successfully.");
    window.location.href = "/private/login";
  };

  return (
    <aside className="hidden h-screen w-64 flex-col justify-between border-r border-border/60 bg-background/80 p-6 backdrop-blur-md lg:flex sticky top-0">
      {/* Top Header & Navigation Links */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <Logo />
        </div>

        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/private"
                ? pathname === "/private"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Area & Logout Button */}
      <div className="border-t border-border/40 pt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-accent/30 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs">
            AC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {siteConfig.author}
            </p>
            <p className="truncate text-[10px] text-muted-foreground font-mono">
              Administrator
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
