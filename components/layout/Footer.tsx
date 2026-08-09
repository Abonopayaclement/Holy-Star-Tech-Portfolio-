import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { footerNav } from "@/constants/navigation";
import { siteConfig } from "@/config/site";
import { socialLinksList } from "@/config/social";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Intro Column */}
          <div className="space-y-4 lg:col-span-2">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Official personal portfolio of{" "}
              <span className="font-semibold text-foreground">{siteConfig.author}</span>.
              Software Engineer, Full-Stack Web Developer, and Mobile Application Developer based in Bolgatanga, Upper East Region, Ghana.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {socialLinksList.map((platform) => {
                const Icon = platform.icon;
                return (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition-all duration-200 ${platform.color}`}
                    aria-label={`${platform.name} Profile`}
                    title={platform.name}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Columns */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.platform.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.explore.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal & Status
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.legal.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              <li>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available for New Projects
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} <span className="font-semibold text-foreground">Holy Star Tech</span>. All rights reserved. Built by {siteConfig.author}.
          </p>
        </div>
      </div>
    </footer>
  );
}
