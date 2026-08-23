import { getProjects } from "@/actions/projects";
import { ProjectsListClient } from "@/components/public/ProjectsListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Engineering Projects & Systems | Holy Star Tech",
  description:
    "Explore a curated showcase of web applications, mobile platforms, UI/UX systems, academic software, and technical solutions built by Holy Star Tech.",
};

export default async function ProjectsPage() {
  // Fetch complete project data and engagement metrics on the server in 1 single pass
  const projects = await getProjects();

  return <ProjectsListClient initialProjects={projects} />;
}
