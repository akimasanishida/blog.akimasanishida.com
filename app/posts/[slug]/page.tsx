import { fetchPostBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { renderMarkdownToHTML } from "@/lib/markdown";
import "katex/dist/katex.min.css";
import "prism-themes/themes/prism-one-dark.css";
import PostMetadata from "@/components/PostMetadata";

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

  return (
    <article className="article">
      <header className="mb-4">
        <h1 className="text-4xl mb-4">{post.title}</h1>
        <div className="mb-4">
          <PostMetadata
            publishedAt={post.published_at}
            updatedAt={post.updated_at}
            category={post.category}
          />
        </div>
        <hr className="border-t mb-4" />
      </header>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  );
}
