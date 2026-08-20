import Link from "next/link";
import { ArrowRight, Code2, Hammer, Smartphone, Terminal } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { siteConfig } from "@/config/site";
import { getActiveWork } from "@/actions/active-work";

import { EngagementSection } from "@/components/public/EngagementSection";

export const metadata = {
  title: `What's New | ${siteConfig.name}`,
  description: `Current projects, active learning, recent updates, and ongoing software development activities by ${siteConfig.author}.`,
};

export default async function WhatsNewPage() {
  const activeWork = await getActiveWork();

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="Latest Updates"
          title="What's New & Currently Working On"
          description="A transparent log of current software projects, active technology learning, and recent portfolio updates."
        />

        {/* 1. ACTIVE WORK ITEM TRACKER */}
        {activeWork ? (
          <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold">
                  <Hammer className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                    Active Development Project
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{activeWork.title}</h3>
                </div>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-mono text-xs font-bold text-indigo-500">
                ● {activeWork.status || "In Progress"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {activeWork.description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Development Milestone Completion</span>
                <span className="font-bold text-foreground">{activeWork.progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${activeWork.progress}%` }}
                />
              </div>
            </div>

            {/* REAL-TIME ENGAGEMENT FOR ACTIVE WORK */}
            <EngagementSection
              targetType="PROJECT"
              slug="active-work-item"
              itemTitle={activeWork.title}
            />
          </section>
        ) : null}

        {/* 2. CURRENT LEARNING & DEVELOPMENT ACTIVITIES */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Current Learning & Technical Focus
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 font-bold">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">React & Next.js Frameworks</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Actively learning modern React component architecture, server actions, and Next.js App Router patterns.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Node.js & Express APIs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Building REST API services, JSON request handling, and backend middleware server routines.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 font-bold">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Android Studio & Mobile Apps</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Developing native Android utility applications using Java and XML layout designs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-background via-indigo-950/10 to-background p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Explore All Projects
          </h2>
          <p className="max-w-md mx-auto text-xs text-muted-foreground">
            Check out completed applications, academic projects, and mobile utilities.
          </p>
          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105"
            >
              <span>View Projects Page</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
