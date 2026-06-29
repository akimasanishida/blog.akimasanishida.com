import type { Metadata } from "next";
import { fetchPostBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { renderMarkdownToHTML } from "@/lib/markdown";
import { buildExcerpt } from "@/lib/post-format";
import "katex/dist/katex.min.css";
import "prism-themes/themes/prism-one-dark.css";
import PostMetadata from "@/components/PostMetadata";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return { title: "記事が見つかりません", robots: { index: false } };
  }

  const description = buildExcerpt(post.content);
  return {
    title: post.title ?? "無題の記事",
    description,
    openGraph: {
      type: "article",
      title: post.title ?? undefined,
      description,
      url: `/posts/${slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
    },
  };
}

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
