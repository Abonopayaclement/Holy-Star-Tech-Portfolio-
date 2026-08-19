import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Database,
  Download,
  ExternalLink,
  FolderGit2,
  Github,
  Layers,
  Lightbulb,
  Play,
  Rocket,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { projectsData } from "@/constants/projects";
import { siteConfig } from "@/config/site";
import { getProjectBySlug } from "@/actions/projects";
import { EngagementSection } from "@/components/public/EngagementSection";
import { InterfaceGallery } from "@/components/public/InterfaceGallery";

interface ProjectDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { slug } = await params;
  
  // Try fetching from database first
  const dbProject = await getProjectBySlug(slug);
  const fallbackProject = projectsData.find((p) => p.slug === slug);

  if (!dbProject && !fallbackProject) {
    notFound();
  }

  const project = dbProject
    ? {
        title: dbProject.title,
        tagline: dbProject.tagline,
        fullDescription: dbProject.fullDescription,
        systemArchitecture: (dbProject as any).systemArchitecture || null,
        category:
          (dbProject.categoryType as string) === "MOBILE_APP"
            ? "Mobile Applications"
            : (dbProject.categoryType as string) === "ACADEMIC"
            ? "Academic Projects"
            : (dbProject.categoryType as string) === "UI_UX"
            ? "UI/UX Designs"
            : (dbProject.categoryType as string) === "OTHER"
            ? "Other Projects"
            : "Web Applications",
        classification: (dbProject as any).classification || fallbackProject?.classification || "Project",
        status: (dbProject as any).status || fallbackProject?.status || "Completed",
        gradient: dbProject.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
        featuredImage: (dbProject as any).featuredImage,
        techStack: Array.isArray(dbProject.techStack) ? (dbProject.techStack as string[]) : [],
        features: Array.isArray(dbProject.features) ? (dbProject.features as string[]) : [],
        screenshots: Array.isArray(dbProject.screenshots) ? (dbProject.screenshots as any[]) : [],
        githubUrl: dbProject.githubUrl,
        liveUrl: dbProject.liveUrl,
        apkUrl: dbProject.apkUrl,
        version: (dbProject as any).version,
        androidVersion: (dbProject as any).androidVersion,
        challenges: Array.isArray(dbProject.challenges) ? (dbProject.challenges as string[]) : [],
        solutions: Array.isArray(dbProject.solutions) ? (dbProject.solutions as string[]) : [],
        lessonsLearned: Array.isArray(dbProject.lessonsLearned) ? (dbProject.lessonsLearned as string[]) : [],
        futureImprovements: Array.isArray((dbProject as any).futureImprovements)
          ? ((dbProject as any).futureImprovements as string[])
          : fallbackProject?.futureImprovements || [],
      }
    : (fallbackProject as any);

  return (
    <div className="relative overflow-hidden pt-8 pb-24">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects Showcase
          </Link>
        </div>

        {/* HERO SECTION CONTAINER */}
        <div className="space-y-6">
          {/* 1. HERO IMAGE (CLEARLY VISIBLE, PROMINENT, UN-CROPPED, NO OVERLAY) */}
          {project.featuredImage && (
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-zinc-950/80 p-2 sm:p-4 shadow-2xl backdrop-blur-md">
              <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-900/60 min-h-[260px] sm:min-h-[380px] max-h-[520px]">
                <img
                  src={project.featuredImage}
                  alt={project.title}
                  className="h-auto max-h-[500px] w-full object-contain mx-auto rounded-xl"
                />
              </div>
            </div>
          )}

          {/* 2. PROJECT TITLE & DETAILS (POSITIONED BELOW HERO IMAGE) */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono font-bold text-indigo-500">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>{project.classification ? `${project.classification} • ` : ""}Case Study • {project.category}</span>
                </div>
                {project.status && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-500">
                    Status: {project.status}
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                Lead Architect: <span className="font-bold text-foreground">{siteConfig.author}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl tracking-tight">
                {project.title}
              </h1>

              <p className="max-w-4xl text-base sm:text-xl text-muted-foreground font-medium leading-relaxed">
                {project.tagline}
              </p>

              {project.version && (
                <div className="inline-flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-bold text-emerald-500">
                    Release Version: {project.version}
                  </span>
                  {project.androidVersion && (
                    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-indigo-400 font-bold">
                      Target SDK: {project.androidVersion}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ACTION LINKS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-2">
                {project.techStack.map((tech: string) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-border/60 bg-accent/40 px-3 py-1 text-xs font-mono font-medium text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[44px]"
                  >
                    <Github className="h-4 w-4 text-indigo-500" />
                    GitHub Repository
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-transform hover:scale-105 min-h-[44px]"
                  >
                    Live Demo
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {project.apkUrl && (
                  <a
                    href={project.apkUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105 min-h-[44px]"
                  >
                    <Download className="h-4 w-4" />
                    Download APK
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CASE STUDY MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* LEFT 2 COLUMNS: DETAILED CASE STUDY SECTIONS */}
          <div className="space-y-10 lg:col-span-2">
            {/* 1. OVERVIEW & PROBLEM STATEMENT */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                <Layers className="h-5 w-5 text-indigo-500" /> Executive Summary & Problem Statement
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.fullDescription}
              </p>
            </section>

            {/* 2. RESEARCH, PLANNING & ARCHITECTURE */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                <Database className="h-5 w-5 text-indigo-500" /> System Architecture & Engineering Approach
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.systemArchitecture ||
                  "Designed for optimal type safety, modular maintainability, and client responsiveness. Utilizes clean code patterns, reactive state synchronization, and strict input validation."}
              </p>
              <div className="rounded-2xl border border-border/60 bg-accent/30 p-4 space-y-2 text-xs font-mono text-foreground">
                <div className="flex items-center gap-2 text-indigo-500 font-bold">
                  <Terminal className="h-4 w-4" /> Architectural Pillars:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Decoupled client state and modular components.</li>
                  <li>Pre-confirmation validation & error prevention routines.</li>
                  <li>Optimized rendering and mobile responsive interface design.</li>
                </ul>
              </div>
            </section>

            {/* 3. KEY SYSTEM FEATURES */}
            {project.features.length > 0 && (
              <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                  <Zap className="h-5 w-5 text-indigo-500" /> Key System Features Breakdown
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.features.map((feature: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground leading-relaxed"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 4. CHALLENGES & SOLUTIONS */}
            {(project.challenges.length > 0 || project.solutions.length > 0) && (
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {project.challenges.length > 0 && (
                  <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
                    <div className="flex items-center gap-2 text-rose-500 border-b border-border/60 pb-2">
                      <ShieldAlert className="h-5 w-5" />
                      <h3 className="text-base font-bold text-foreground">Challenges Encountered</h3>
                    </div>
                    <ul className="space-y-2">
                      {project.challenges.map((c: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.solutions.length > 0 && (
                  <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
                    <div className="flex items-center gap-2 text-emerald-500 border-b border-border/60 pb-2">
                      <Lightbulb className="h-5 w-5" />
                      <h3 className="text-base font-bold text-foreground">Engineered Solutions</h3>
                    </div>
                    <ul className="space-y-2">
                      {project.solutions.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* 5. INTERFACE GALLERY WITH INTERACTIVE LIGHTBOX */}
            {project.screenshots && project.screenshots.length > 0 && (
              <InterfaceGallery screenshots={project.screenshots} />
            )}
          </div>

          {/* RIGHT SIDEBAR: METRICS, LESSONS & FUTURE IMPROVEMENTS */}
          <div className="space-y-8">
            {/* TECHNOLOGIES USED */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
              <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                Technologies & Tools Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech: string) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-border/60 bg-accent/40 px-3 py-1.5 text-xs font-mono font-medium text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* LESSONS LEARNED */}
            {project.lessonsLearned && project.lessonsLearned.length > 0 && (
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-amber-500 border-b border-border/60 pb-2">
                  <Sparkles className="h-4 w-4" />
                  <h3 className="text-sm font-bold text-foreground">Lessons Learned</h3>
                </div>
                <ul className="space-y-2">
                  {project.lessonsLearned.map((l: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      ✓ {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PLANNED FUTURE IMPROVEMENTS / ROADMAP */}
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-tr from-indigo-500/10 via-background to-cyan-500/10 p-6 backdrop-blur-md shadow-md space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-500">
                <Rocket className="h-4 w-4" /> Future Roadmap
              </div>
              <h3 className="text-base font-bold text-foreground">Planned Enhancements</h3>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                {project.futureImprovements && project.futureImprovements.length > 0 ? (
                  project.futureImprovements.map((imp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li>• Automated end-to-end telemetry testing.</li>
                    <li>• Real-time WebSocket synchronization improvements.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* LIKES & COMMENTS ENGAGEMENT SECTION */}
        <EngagementSection targetType="PROJECT" slug={slug} itemTitle={project.title} />
      </div>
    </div>
  );
}

