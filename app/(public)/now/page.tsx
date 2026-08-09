import { siteConfig } from "@/config/site";

export default function NowPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
        What {siteConfig.author} is Doing Now
      </h1>
      <p className="mt-4 text-muted-foreground">
        Current focus areas, ongoing engineering research, and active projects. (Content coming in Phase Two).
      </p>
    </div>
  );
}
