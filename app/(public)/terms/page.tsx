import Link from "next/link";
import { ArrowLeft, BookOpen, Shield, AlertCircle, FileCheck, HelpCircle } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: `Terms & Conditions | ${siteConfig.name}`,
  description: `Terms & Conditions for accessing and using ${siteConfig.name}.`,
};

export default function TermsPage() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          badge="Legal & Terms"
          title="Terms & Conditions"
          description={`Last updated: August 2026 • Official Terms of Use for ${siteConfig.name}`}
        />

        <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-sm leading-relaxed">
          {/* SECTION 1 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <BookOpen className="h-4 w-4 text-indigo-500" /> 1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By accessing or utilizing the website <strong className="text-foreground">{siteConfig.name}</strong>, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please discontinue using this website.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Shield className="h-4 w-4 text-indigo-500" /> 2. Intellectual Property Rights
            </h2>
            <p className="text-muted-foreground">
              All content on this site—including case study documentations, architectural diagrams, custom code samples, project demonstrations, blog articles, logos, and UI designs—is the exclusive intellectual property of <strong className="text-foreground">{siteConfig.author}</strong> unless explicitly stated otherwise.
            </p>
            <p className="text-muted-foreground">
              Open-source repositories referenced on this website remain subject to their respective open-source software licenses (e.g., MIT, Apache 2.0).
            </p>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <FileCheck className="h-4 w-4 text-indigo-500" /> 3. Website Usage & Acceptable Conduct
            </h2>
            <p className="text-muted-foreground">
              When visiting this portfolio platform, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Attempt unauthorized administrative access or disrupt web server operations.</li>
              <li>Scrape or harvest data automatically without prior written consent.</li>
              <li>Submit malicious payloads, spam messages, or false contact entries.</li>
            </ul>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <AlertCircle className="h-4 w-4 text-indigo-500" /> 4. External Links & Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              This website contains links to external third-party platforms (e.g., GitHub, live project deployments, LinkedIn). We are not responsible for the content, privacy policies, or practices of third-party services.
            </p>
            <p className="text-muted-foreground">
              All information and downloadable resources are provided "as is" without warranty of any kind. <strong className="text-foreground">{siteConfig.author}</strong> shall not be liable for any direct or indirect damages resulting from site usage.
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <HelpCircle className="h-4 w-4 text-indigo-500" /> 5. Questions & Contact Information
            </h2>
            <p className="text-muted-foreground">
              For questions regarding these Terms & Conditions, please contact:{" "}
              <a href="mailto:ayebonoclement@gmail.com" className="font-mono text-indigo-500 hover:underline">
                ayebonoclement@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
