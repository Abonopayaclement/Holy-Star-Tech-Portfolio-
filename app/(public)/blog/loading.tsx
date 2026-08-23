import React from "react";

export default function BlogLoading() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-44 w-full rounded-3xl bg-card/60 border border-border/40" />

        {/* Search & Filter Pills Skeleton */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="h-10 w-full rounded-2xl bg-card/60 border border-border/40" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 rounded-xl bg-card/60 border border-border/40" />
            ))}
          </div>
        </div>

        {/* 6 Article Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-3xl border border-border/40 bg-card/40 p-6 space-y-4"
            >
              <div className="h-44 w-full rounded-2xl bg-muted/60" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-16 rounded bg-muted/60" />
                  <div className="h-3 w-14 rounded bg-muted/60" />
                </div>
                <div className="h-5 w-4/5 rounded bg-muted/60" />
                <div className="h-3 w-full rounded bg-muted/60" />
                <div className="h-3 w-2/3 rounded bg-muted/60" />
              </div>
              <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                <div className="h-4 w-24 rounded bg-muted/60" />
                <div className="h-4 w-16 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
