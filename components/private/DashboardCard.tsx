import * as React from "react";
import { LucideIcon } from "lucide-react";

interface StatDetail {
  label: string;
  value: string | number;
  color?: string;
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  details?: StatDetail[];
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  gradient = "from-amber-500/10 via-indigo-600/10 to-cyan-500/10",
  details,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-background/90 p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl ${className}`}
    >
      {/* Visual Accent */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-tr ${gradient} blur-2xl opacity-60 transition-opacity group-hover:opacity-100`}
      />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-accent/40 text-foreground transition-transform group-hover:scale-110">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {value}
        </div>
      </div>

      {details && details.length > 0 && (
        <div className="mt-6 border-t border-border/40 pt-4 flex flex-wrap gap-4 text-xs font-medium">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{detail.label}:</span>
              <span className={detail.color || "font-semibold text-foreground"}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
