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

        {/* 3. ACADEMIC & QUALIFICATIONS GRID */}
        <section className="space-y-8 border-t border-border/40 pt-16">
          <SectionHeader
            badge="Education"
            title="Academic Background & Training"
            description="Academic qualifications and technical training in Computer Science, Hardware, and Networking."
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Kumasi Technical University Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-indigo-500">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">Kumasi Technical University (KSTU)</span>
                </div>
                <span className="text-xs font-mono text-indigo-500 font-semibold rounded-full bg-indigo-500/10 px-3 py-1">
                  Tertiary Studies
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">HND Computer Science</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Advanced studies focusing on software engineering principles, database systems with MySQL, web applications, object-oriented programming in Java and Python, and mobile app development in Android Studio.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-500">
                  Key Courses & Subjects Studied:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Software Engineering
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Database Development & MySQL
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Mobile App Development (Android Studio)
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Java & Python Programming
                  </span>
                </div>
              </div>
            </div>

            {/* Bolgatanga Technical Institute Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-xl transition-all duration-300 hover:border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-500">
                  <Wrench className="h-5 w-5" />
                  <span className="text-xs font-mono font-bold">Bolgatanga Technical Institute (Boga Technical)</span>
                </div>
                <span className="text-xs font-mono text-amber-500 font-semibold rounded-full bg-amber-500/10 px-3 py-1">
                  Technical Foundation
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Computer Hardware & Networking</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hands-on practical training in electronics, hardware diagnostics, motherboard inspection, computer networking configuration, operating system installation, and system maintenance.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-500">
                  Key Courses & Subjects Studied:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Electronics and Computer Hardware
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Computer Networking
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Practical Computer Networking Skills
                  </span>
                  <span className="rounded-lg border border-border/60 bg-accent/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    Hardware Diagnostics & Maintenance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TECHNICAL SKILLS SECTION */}
        <section className="space-y-8 border-t border-border/40 pt-16">
          <SectionHeader
            badge="Skills"
            title="Technical Skills"
            description="Software development, programming languages, computer networking, and hardware capabilities."
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Laptop className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Web Development</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                HTML5, CSS3, JavaScript, React, Next.js, responsive web interfaces.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Backend & Database Development</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Node.js, Express.js APIs, and MySQL for relational backend database development.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Mobile Application Development</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Android Studio for developing native Android mobile applications.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Computer Hardware</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Electronics and computer hardware diagnostics, system maintenance, OS installation, and hardware troubleshooting.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Computer Networking</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Computer networking principles and practical computer networking skills.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Programming Languages</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Python, Java, and JavaScript.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3 lg:col-span-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Development Tools</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visual Studio Code, Git, GitHub, XAMPP, and Android Studio SDK.
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

