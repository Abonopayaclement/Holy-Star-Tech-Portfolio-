import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FolderGit2,
  Mail,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { HomeHeroSlider } from "@/components/public/HomeHeroSlider";
import { siteConfig } from "@/config/site";
import { getProjects } from "@/actions/projects";
import { getBlogPosts } from "@/actions/blog";
import { getSkillsData, getProfileData, getResumeData } from "@/actions/profile";
import { CardEngagement } from "@/components/public/CardEngagement";

export default async function HomePage() {
  const [projects, posts, skills, profile, resume] = await Promise.all([
    getProjects(),
    getBlogPosts(),
    getSkillsData(),
    getProfileData(),
    getResumeData(),
  ]);

  // Featured projects on homepage: Hotel Management System, COMPSSA Management System & Smart Data Usage
  const featuredProjects = projects.filter((p: any) => p.featured).slice(0, 3);
  const displayProjects = featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 3);
  const latestArticles = posts.slice(0, 3);

  // Group Skills by category
  const skillCategoriesMap: Record<string, string[]> = {};
  skills.forEach((s: any) => {
    const cat = s.category || "General";
    if (!skillCategoriesMap[cat]) skillCategoriesMap[cat] = [];
    skillCategoriesMap[cat].push(s.name);
  });

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION WITH SYNCHRONIZED TEXT ROTATION & SLIDER */}
      <HomeHeroSlider />

      {/* 2. FEATURED PROJECTS SECTION (CENTER ALIGNED) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <SectionHeader
            badge="Selected Works"
            title="Featured Projects"
            description="Explore production-grade software applications built for web and mobile platforms."
            align="center"
          />
        </div>

        {displayProjects.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
            No projects available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {displayProjects.map((project: any) => {
              const techList = Array.isArray(project.techStack)
                ? project.techStack
                : [];

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Featured Image */}
                    {project.featuredImage ? (
                      <div className="h-48 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative">
                        <img
                          src={project.featuredImage}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                        <FolderGit2 className="h-12 w-12 text-indigo-500/60" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                          {project.categoryType}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-indigo-500 transition-colors">
                        {project.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Tech Stack Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {techList.slice(0, 4).map((tech: string) => (
                        <span
                          key={tech}
                          className="rounded-md border border-border/60 bg-accent/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-border/60 mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardEngagement
                        targetType="PROJECT"
                        slug={project.slug}
                        itemTitle={project.title}
                      />
                      {project.categoryType === "MOBILE_APP" && project.apkUrl && (
                        <a
                          href={project.apkUrl}
                          download
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all"
                        >
                          <Download className="h-3.5 w-3.5" /> APK
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                      >
                        <span>View Case Study</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105"
          >
            <span>Explore All Projects</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 3. LATEST BLOG POSTS (CENTER ALIGNED) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <SectionHeader
            badge="Blog Posts"
            title="Featured Blog Posts"
            description="Insights, tutorials, and practical guides on web development, mobile applications, and software engineering."
            align="center"
          />
        </div>

        {latestArticles.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
            No published blog posts available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {latestArticles.map((post: any) => {
              const formattedDate = new Date(post.publishedAt || post.updatedAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              const cardImage = Array.isArray(post.images) && post.images.length > 0
                ? post.images[0]
                : "/logo.png";

              return (
                <div
                  key={post.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Featured Card Image */}
                    <div className="h-44 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative">
                      <img
                        src={cardImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {post.category || "Development"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-border/60 mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardEngagement
                        targetType="BLOG"
                        slug={post.slug}
                        itemTitle={post.title}
                      />
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                      >
                        <span>Continue Reading</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-6 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <span>Explore All Blog Posts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 4. TECHNOLOGY STACK (CENTER ALIGNED) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          badge="Skills & Tools"
          title="Technology Stack"
          description="Technologies, programming languages, and development tools utilized across projects."
          align="center"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(skillCategoriesMap).map(([category, items]) => (
            <div
              key={category}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-4"
            >
              <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider border-b border-border/60 pb-2 text-center">
                {category}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-accent/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeaderBanner
          badge="Let's Work Together"
          title="Need a Web or Mobile Software Developer?"
          description="Whether you need a full-stack web application, an Android mobile app, or custom software solutions, I am available for projects, freelance opportunities, and software development collaborations."
          imageSrc="/uploads/images/15.jpeg"
          imageAlt="Abonopaya Clement Ayebono - Software Developer"
          overlayOpacity="bg-slate-950/75"
          cropPosition="object-[center_20%]"
          align="center"
          size="compact"
        >
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-xs font-semibold text-slate-950 shadow-xl transition-all hover:scale-105 min-h-[48px]"
            >
              <Mail className="h-4 w-4" />
              <span>Start a Conversation</span>
            </Link>
          </div>
        </PageHeaderBanner>
      </section>
    </div>
  );
}
