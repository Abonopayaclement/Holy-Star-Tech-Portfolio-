import { getBlogPosts } from "@/actions/blog";
import { BlogListClient } from "@/components/public/BlogListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Software Engineering Blog | Holy Star Tech",
  description:
    "In-depth tutorials, system design breakdowns, and technical articles on full-stack web and mobile development.",
};

export default async function BlogPage() {
  // Pre-fetch all published articles and engagement metrics on the server in 1 pass
  const articles = await getBlogPosts();

  return <BlogListClient initialArticles={articles} />;
}
