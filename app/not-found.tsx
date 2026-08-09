import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "12s" }} />
      </div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-indigo-500">
        Error 404
      </span>
      <h1 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        The requested resource path does not exist on Holy Star Tech.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Home
      </Link>
    </div>
  );
}
