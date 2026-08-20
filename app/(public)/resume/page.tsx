import {
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Terminal,
} from "lucide-react";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { siteConfig } from "@/config/site";
import { getResumeData } from "@/actions/profile";

export const metadata = {
  title: `Interactive Resume | ${siteConfig.name}`,
  description: `Official Curriculum Vitae of ${siteConfig.author}. Software Engineer, Full-Stack Web Developer, and Mobile Application Developer.`,
};

export default async function ResumePage() {
  const resume = await getResumeData();
  const cvFileUrl = resume?.cvFileUrl || "/resume.pdf";

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Decorative Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeaderBanner
          badge="Curriculum Vitae"
          title="Interactive Resume"
          description="Comprehensive overview of career objective, technical skills, software projects, education, and certifications."
          gradientClass="bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-900"
          align="center"
          size="compact"
        />

        {/* TOP ACTION BANNER & DOWNLOAD BUTTON */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border/60 bg-background/80 p-6 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {siteConfig.author} — Official CV (PDF)
              </h3>
              <p className="text-xs text-muted-foreground">
                Verified Credentials • Bolgatanga, Upper East Region, Ghana
              </p>
            </div>
          </div>

          <a
            href={cvFileUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 min-h-[48px]"
          >
            <Download className="h-4 w-4" />
            Download Complete CV
          </a>
        </div>

        {/* RESUME DOCUMENT PREVIEW CONTAINER */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-border/60 bg-background/90 p-8 md:p-12 shadow-xl backdrop-blur-md">
          {/* Header Section inside Resume */}
          <div className="border-b border-border/60 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{siteConfig.author}</h1>
              <p className="mt-1 text-base font-semibold text-indigo-500">
                Software Engineer • Full-Stack Web Developer • Mobile Application Developer
              </p>
              <p className="mt-2 text-xs text-muted-foreground max-w-xl leading-relaxed">
                Full-Stack Web Development, Android Mobile Application Development, and practical software engineering based in Bolgatanga, Upper East Region, Ghana.
              </p>
            </div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <p>📍 Location: Bolgatanga, Upper East Region, Ghana</p>
              <p>📧 Email: abonopayaclementayebono@gmail.com</p>
              <p>💻 GitHub: github.com/ayebonoclement</p>
            </div>
          </div>

          {/* CAREER OBJECTIVE */}
          <div className="pt-8 border-b border-border/60 pb-8 space-y-2">
            <h2 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Career Objective</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dedicated student software engineer seeking to leverage strong problem-solving capabilities, computer hardware troubleshooting expertise, and programming proficiencies in Python, Java, JavaScript, and web/mobile frameworks to build clean, functional software solutions.
            </p>
          </div>

          {/* Core Sections Grid */}
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Main Timeline Column */}
            <div className="space-y-10 lg:col-span-2">
              {/* Technical Projects */}
              <div>
                <div className="flex items-center gap-2 text-indigo-500 mb-6">
                  <Briefcase className="h-5 w-5" />
                  <h2 className="text-xl font-bold text-foreground">Technical Software Projects</h2>
                </div>

                <div className="space-y-6 border-l-2 border-border/80 pl-6">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-indigo-500 bg-background" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Hostel Management System
                      </h3>
                      <span className="text-xs font-mono font-semibold text-emerald-500">Completed</span>
                    </div>
                    <p className="text-xs font-mono text-indigo-500">Academic Project • Python, Flask, MySQL, HTML, CSS</p>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <li>• Designed a student hostel accommodation management system for room slot allocation.</li>
                      <li>• Enforced room capacity validation checks to eliminate over-booking.</li>
                      <li>• Maintained occupant records and payment verification logs.</li>
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-amber-500 bg-background" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">COMPSSA Management System</h3>
                      <span className="text-xs font-mono font-semibold text-amber-500">In Progress</span>
                    </div>
                    <p className="text-xs font-mono text-amber-500">Web Portal • JavaScript, React, Node.js, Express.js, MySQL</p>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <li>• Developed a student association management portal for Computer Science course resources.</li>
                      <li>• Implemented role-based middleware to separate executive functions from member downloads.</li>
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-cyan-500 bg-background" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">Smart Data Usage & Mobile Apps</h3>
                      <span className="text-xs font-mono font-semibold text-cyan-500">Mobile Development</span>
                    </div>
                    <p className="text-xs font-mono text-cyan-500">Android Studio • Java, XML UI, Android SDK</p>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <li>• Built native Android mobile utility applications for data usage tracking and arithmetic calculations.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center gap-2 text-indigo-500 mb-6">
                  <GraduationCap className="h-5 w-5" />
                  <h2 className="text-xl font-bold text-foreground">Education</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-accent/20 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">Kumasi Technical University</h3>
                      <span className="text-xs font-mono font-semibold text-indigo-500">HND Computer Science</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Focused on software engineering, database management systems, web development, and algorithms.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-accent/20 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">Bolgatanga Technical Institute</h3>
                      <span className="text-xs font-mono font-semibold text-amber-500">Computer Hardware</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Practical training in computer hardware troubleshooting, OS installation, and system maintenance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Skills & Certifications Column */}
            <div className="space-y-8">
              {/* Technical Skills */}
              <div className="rounded-2xl border border-border/60 bg-accent/20 p-6">
                <div className="flex items-center gap-2 text-indigo-500 mb-4">
                  <Terminal className="h-5 w-5" />
                  <h3 className="text-base font-bold text-foreground">Technical Proficiencies</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">Languages:</span>
                    <p className="text-muted-foreground">Python, Java, JavaScript</p>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Frontend:</span>
                    <p className="text-muted-foreground">HTML, CSS, React (Learning), Next.js (Learning)</p>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Backend & Database:</span>
                    <p className="text-muted-foreground">Node.js (Learning), Express.js (Learning), MySQL, PostgreSQL (Learning)</p>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Mobile & Tools:</span>
                    <p className="text-muted-foreground">Android Studio, Visual Studio Code, Git, GitHub, XAMPP</p>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="rounded-2xl border border-border/60 bg-accent/20 p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Award className="h-5 w-5" />
                  <h3 className="text-base font-bold text-foreground">Certifications</h3>
                </div>

                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Certificate in Programming and Cybersecurity</p>
                      <p className="text-[11px]">Khoders World — 2025</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Core Competencies */}
              <div className="rounded-2xl border border-border/60 bg-accent/20 p-6 space-y-3">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Core Competencies</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">Full-Stack Development</span>
                  <span className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">Android App Development</span>
                  <span className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">Database Management</span>
                  <span className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">Hardware Troubleshooting</span>
                  <span className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">Continuous Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
