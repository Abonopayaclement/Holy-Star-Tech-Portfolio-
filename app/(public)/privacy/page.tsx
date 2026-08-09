import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Privacy Policy and data protection guidelines for ${siteConfig.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          badge="Legal & Compliance"
          title="Privacy Policy"
          description={`Last updated: August 2026 • Official Data Protection Guidelines for ${siteConfig.name}`}
        />

        <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8 text-sm leading-relaxed">
          {/* SECTION 1 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Shield className="h-4 w-4 text-indigo-500" /> 1. Overview & Commitment
            </h2>
            <p className="text-muted-foreground">
              At <strong className="text-foreground">{siteConfig.name}</strong>, operated by{" "}
              <strong className="text-foreground">{siteConfig.author}</strong>, we respect your personal privacy. This Privacy Policy details how information is collected, processed, and safeguarded when visiting our website or interacting with our contact services.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Lock className="h-4 w-4 text-indigo-500" /> 2. Information Collected
            </h2>
            <p className="text-muted-foreground">
              We only collect personal information that you voluntarily provide when using our contact forms or reaching out directly. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Full Name & Contact Email Address.</li>
              <li>Message subject and communication inquiry details.</li>
              <li>Technical metadata automatically provided by modern web browsers (IP address, User Agent, referrer headers).</li>
            </ul>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Eye className="h-4 w-4 text-indigo-500" /> 3. Use of Information
            </h2>
            <p className="text-muted-foreground">
              Collected information is used exclusively to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Respond to professional inquiries, consulting proposals, and message submissions.</li>
              <li>Maintain software security, prevent spam, and optimize system uptime.</li>
              <li>We strictly do <strong className="text-foreground">NOT</strong> sell, rent, or trade your personal data to third parties for marketing purposes.</li>
            </ul>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <FileText className="h-4 w-4 text-indigo-500" /> 4. Cookies & Analytics
            </h2>
            <p className="text-muted-foreground">
              This portfolio website uses essential cookies and local storage tokens solely for session management (such as administrator authentication and light/dark theme preference saving). Future web analytics integrations will be privacy-focused and aggregated without tracking individual personal identities.
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" /> 5. Data Security & Contact Information
            </h2>
            <p className="text-muted-foreground">
              We employ industry-standard encryption protocols (HTTPS/SSL) and secure server infrastructure to protect submitted messages.
            </p>
            <p className="text-muted-foreground pt-2">
              If you have questions regarding this Privacy Policy, please contact us at:{" "}
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
