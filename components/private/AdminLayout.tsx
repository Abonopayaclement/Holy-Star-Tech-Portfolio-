"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Sidebar } from "@/components/private/Sidebar";
import { MobileSidebar } from "@/components/private/MobileSidebar";
import { DashboardHeader } from "@/components/private/DashboardHeader";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { data: session, isPending } = authClient.useSession();

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      const currentPath = window.location.pathname || "/private";
      window.location.href = `/private/login?from=${encodeURIComponent(currentPath)}`;
    }
  }, [isPending, session]);

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-xs font-mono font-medium text-muted-foreground">
            Verifying Administrator Access...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans antialiased">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader
          title={title}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
