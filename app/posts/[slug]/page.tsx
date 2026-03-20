import { fetchPostBySlug } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const paramas = await props.params;
  const slug = paramas.slug;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // TODO: This is just for development rendering. We will add more features later.
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
