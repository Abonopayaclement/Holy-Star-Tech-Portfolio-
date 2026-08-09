export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="h-4 w-4 rounded-full bg-amber-500 animate-pulse" />
      </div>
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
        Loading Holy Star Tech...
      </p>
    </div>
  );
}
