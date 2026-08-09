import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  GraduationCap,
  Laptop,
  Mail,
  Smartphone,
  Terminal,
  Users,
  Wrench,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { AboutProfileCarousel } from "@/components/public/AboutProfileCarousel";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: `About Me | ${siteConfig.name}`,
  description: `Learn more about ${siteConfig.author}, HND Computer Science student at Kumasi Technical University with a Computer Hardware background from Bolgatanga Technical Institute.`,
};

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden pt-6 pb-20">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* 1. HEADER BANNER (Reduced visible prominence ~15%) */}
        <PageHeaderBanner
          badge="About Me"
          title={`Software Developer & Learner — ${siteConfig.author}`}
          description="HND Computer Science student passionate about software engineering, full-stack web development, Android mobile applications, and computer hardware."
          imageSrc="/uploads/images/14.jpeg"
          imageAlt={siteConfig.author}
          cropPosition="object-[center_10%]"
          overlayOpacity="bg-slate-950/75"
          align="center"
          size="compact"
        />

        {/* 2. INTRODUCTION & PERSONAL JOURNEY WITH 7-IMAGE CAROUSEL */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-500">
              <Code2 className="h-3.5 w-3.5" />
              <span>Personal Journey</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Building Practical Digital Solutions
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Hello! I am <strong className="text-foreground">{siteConfig.author}</strong>, a software developer based in <strong className="text-foreground">Bolgatanga, Upper East Region, Ghana</strong>.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              I am currently pursuing my <strong className="text-foreground">HND in Computer Science at Kumasi Technical University</strong>, building upon my foundational training in <strong className="text-foreground">Computer Hardware from Bolgatanga Technical Institute</strong>.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              My engineering journey combines hands-on hardware troubleshooting with full-stack web and mobile application development. I enjoy taking real-world problems—such as room booking management, queue optimization, and data monitoring—and transforming them into reliable software tools.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-xs font-semibold text-background shadow-md transition-transform hover:scale-[1.02]"
              >
                View My Projects
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-5 py-3 text-xs font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-accent"
              >
                <Mail className="h-4 w-4 text-indigo-500" />
                Get in Touch
              </Link>
            </div>
          </div>

          {/* Rotating 7-Photo Personal Carousel */}
          <div className="lg:col-span-5">
            <AboutProfileCarousel />
          </div>
        </section>

        {/* 3. ACADEMIC & QUALIFICATIONS GRID (TEXT/CONTENT ONLY - NO PERSONAL PHOTOS) */}
        <section className="space-y-8 border-t border-border/40 pt-16">
          <SectionHeader
            badge="Education"
            title="Academic Background & Training"
            description="Verified academic qualifications in Computer Science and Computer Hardware."
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Kumasi Technical University Card (Text Only) */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-indigo-500">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">Kumasi Technical University</span>
                </div>
                <span className="text-xs font-mono text-indigo-500 font-semibold rounded-full bg-indigo-500/10 px-3 py-1">
                  Tertiary Studies
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">HND Computer Science</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Focusing on software engineering principles, relational database design with MySQL, web applications, object-oriented programming in Java and Python, and mobile app development in Android Studio.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  Software Engineering
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  MySQL & Databases
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  Android Studio
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  Java & Python
                </span>
              </div>
            </div>

            {/* Bolgatanga Technical Institute Card (Text Only) */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-500">
                  <Wrench className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">Bolgatanga Technical Institute</span>
                </div>
                <span className="text-xs font-mono text-amber-500 font-semibold rounded-full bg-amber-500/10 px-3 py-1">
                  Technical Foundation
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Computer Hardware Engineering</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hands-on practical hardware diagnostic training, motherboard component inspection, operating system installation, memory configuration, and system maintenance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  Hardware Diagnostics
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  System Architecture
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  OS Maintenance
                </span>
                <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  Motherboard Assembly
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 & 5. TECHNICAL FOCUS & LEADERSHIP (TEXT/CONTENT ONLY - NO PERSONAL PHOTOS) */}
        <section className="space-y-8 border-t border-border/40 pt-16">
          <SectionHeader
            badge="Engineering Philosophy"
            title="Technical Focus & Leadership"
            description="Combining software architecture with practical campus engineering solutions."
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Technical Systems & Architecture (Text Only) */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-cyan-500">
                  <Terminal className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">Software Architecture</span>
                </div>
                <span className="text-xs font-mono text-cyan-500 font-semibold rounded-full bg-cyan-500/10 px-3 py-1">
                  Technical Focus
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Clean Architecture & Continuous Learning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Emphasizing structured code layout, clear state management, comprehensive technical documentation, and performance optimization across web platforms and API integrations.
                </p>
              </div>
            </div>

            {/* Campus Engineering & COMPSSA Leadership (Text Only) */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-emerald-500">
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">KtU COMPSSA Community</span>
                </div>
                <span className="text-xs font-mono text-emerald-500 font-semibold rounded-full bg-emerald-500/10 px-3 py-1">
                  Leadership
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Campus Software Solutions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Active involvement in departmental project building, student association management portals, and practical software engineering collaborations at Kumasi Technical University.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TECHNICAL PROFICIENCIES GRID */}
        <section className="space-y-8 border-t border-border/40 pt-16">
          <SectionHeader
            badge="Technology Stack"
            title="Technical Skills Breakdown"
            description="Software, programming languages, and hardware capabilities."
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Laptop className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Frontend Web Development</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                HTML5, CSS3, JavaScript, React, Next.js.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Backend & Database</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Node.js, Express.js, and MySQL for structured relational backend data persistence.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Mobile Development</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Android Studio for developing native mobile utilities and apps.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Computer & Hardware Skills</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hardware troubleshooting, software installation, OS installation, and basic maintenance.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Programming Languages</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Python, Java, and JavaScript for software engineering logic.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Development Tools</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visual Studio Code, Git, GitHub, and XAMPP.
              </p>
            </div>
          </div>
        </section>

        {/* 7. BOTTOM CALL TO ACTION BANNER (Reduced visual prominence ~15%) */}
        <PageHeaderBanner
          badge="Let's Connect"
          title="Interested in Collaborating or Working Together?"
          description="I am available for full-stack software engineering, web applications, Android mobile app projects, student collaborations, and freelance opportunities."
          imageSrc="/uploads/images/15.jpeg"
          imageAlt="Abonopaya Clement Ayebono - Software Engineering"
          cropPosition="object-[center_15%]"
          overlayOpacity="bg-slate-950/75"
          align="center"
          size="compact"
        >
          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-xs font-semibold text-slate-950 shadow-xl transition-all hover:scale-105 min-h-[48px]"
            >
              <Mail className="h-4 w-4" /> Start a Conversation
            </Link>
          </div>
        </PageHeaderBanner>
      </div>
    </div>
  );
}

