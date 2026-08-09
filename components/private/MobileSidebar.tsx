"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { adminNavItems } from "@/components/private/Sidebar";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { signOutAdmin } from "@/actions/admin-auth";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-xs flex-col justify-between border-r border-border/60 bg-background p-6 shadow-2xl lg:hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <Logo />
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Close Mobile Sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Large Touch Target Nav Items for Phone Usage */}
              <nav className="space-y-2">
                {adminNavItems.map((item) => {
                  const isActive =
                    item.href === "/private"
                      ? pathname === "/private"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all min-h-[44px]",
                        isActive
                          ? "bg-foreground text-background font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-500">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile & Logout */}
            <div className="border-t border-border/40 pt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-accent/30 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
