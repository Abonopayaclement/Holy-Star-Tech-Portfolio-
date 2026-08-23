import React from "react";

export default function ProjectsLoading() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-44 w-full rounded-3xl bg-card/60 border border-border/40" />

        {/* Filter Pills Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-card/60 border border-border/40" />
            ))}
          </div>
          <div className="h-8 w-64 rounded-full bg-card/60 border border-border/40" />
        </div>

        {/* 6 Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-3xl border border-border/40 bg-card/40 p-6 space-y-4"
            >
              <div className="aspect-video w-full rounded-2xl bg-muted/60" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted/60" />
                <div className="h-5 w-3/4 rounded bg-muted/60" />
                <div className="h-3 w-full rounded bg-muted/60" />
                <div className="h-3 w-5/6 rounded bg-muted/60" />
              </div>
              <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                <div className="h-4 w-28 rounded bg-muted/60" />
                <div className="h-4 w-16 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
