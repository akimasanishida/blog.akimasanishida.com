import { fetchPostBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { renderMarkdownToHTML } from "@/lib/markdown";
import "katex/dist/katex.min.css";
import "prism-themes/themes/prism-one-dark.css";
import { Calendar, RotateCcw } from "lucide-react";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const paramas = await props.params;
  const slug = paramas.slug;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const optionsLocaleString: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const strPublishedAt = post.published_at
    ? new Date(post.published_at).toLocaleString("ja-JP", optionsLocaleString)
    : null;
  const strUpdatedAt = post.updated_at
    ? new Date(post.updated_at).toLocaleDateString("ja-JP", optionsLocaleString)
    : null;
  const contentHtml = await renderMarkdownToHTML(post.content || "");

  return (
    <div className="article">
      <header className="mb-4">
        <h1 className="text-4xl mb-4">{post.title}</h1>
        <div className="flex flex-col md:flex-row md:items-center mb-4 gap-x-4">
          {strPublishedAt && (
            <div className="flex items-center text-(--muted-foreground)">
              <Calendar className="inline-block w-5 h-5 mr-2" />
              {strPublishedAt}
            </div>
          )}
          {strUpdatedAt && (
            <div className="flex items-center text-(--muted-foreground)">
              <RotateCcw className="inline-block w-5 h-5 mr-2" />
              {strUpdatedAt}
            </div>
          )}
        </div>
        <hr className="border-t mb-4" />
      </header>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}
