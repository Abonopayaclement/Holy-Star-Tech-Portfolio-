import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
        <img
          src="/logo.png"
          alt="Holy Star Tech Logo"
          className="h-full w-full object-contain"
        />
      </div>
      {showText && (
        <span className="font-sans text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
          Holy Star <span className="bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">Tech</span>
        </span>
      )}
    </Link>
  );
}
