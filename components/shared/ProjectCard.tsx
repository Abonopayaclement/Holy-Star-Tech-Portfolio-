import Link from "next/link";
import { ArrowUpRight, FolderGit2 } from "lucide-react";

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  link: string;
  gradient: string;
}

interface ProjectCardProps {
  project: ProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Project Graphic / Visual Header */}
      <div
        className={`relative flex h-48 w-full items-center justify-center bg-gradient-to-tr ${project.gradient} p-6 transition-transform duration-500 group-hover:scale-105`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-md shadow-md">
          <FolderGit2 className="h-8 w-8 text-indigo-500" />
        </div>
        <div className="absolute top-4 right-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-mono font-medium text-white backdrop-blur-md">
          {project.category}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-indigo-500">
          {project.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        {/* Technology Tags */}
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-accent/50 px-2.5 py-1 text-xs font-mono text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* View Project Button */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <Link
            href={project.link}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-indigo-500"
          >
            View Project
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
