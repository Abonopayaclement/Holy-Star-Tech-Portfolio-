import { siteConfig } from "@/config/site";

export default function UsesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
        Tech Stack, Gear & Tools Used by {siteConfig.author}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Hardware, development environment, VS Code setup, and productivity stack. (Content coming in Phase Two).
      </p>
    </div>
  );
}
