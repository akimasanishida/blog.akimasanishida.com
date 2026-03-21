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

  const contentHtml = await renderMarkdownToHTML(post.content || "");

  // TODO: This is just for development rendering. We will add more features later.
  return (
    <div>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}
