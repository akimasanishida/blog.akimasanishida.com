import { fetchPostBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { renderMarkdownToHTML } from "@/lib/markdown";
import "katex/dist/katex.min.css";
import "prism-themes/themes/prism-one-dark.css";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const paramas = await props.params;
  const slug = paramas.slug;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const optionsLocaleString = {
    timeZone: "Asia/Tokyo"
  };

  console.log("post.published_at", post.published_at);

  const strPublishedAt = post.published_at
    ? new Date(post.published_at).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    })
    : null;
  const strUpdatedAt = post.updated_at
    ? new Date(post.updated_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const contentHtml = await renderMarkdownToHTML(post.content || "");

  // TODO: This is just for development rendering. We will add more features later.
  return (
    <div className="article">
      <h1 className="text-4xl mb-2">{post.title}</h1>
      <p className="text-gray-500 mb-4">公開日: {strPublishedAt}</p>
      <p className="text-gray-500 mb-4">更新日: {strUpdatedAt}</p>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}
