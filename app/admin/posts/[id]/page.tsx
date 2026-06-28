import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { fetchPostById, fetchCategories } from "@/lib/data";
import { listMedia } from "@/lib/storage";

// /admin 配下のため proxy.ts のミドルウェアで自動的に認証保護される。
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const [post, categories, media] = await Promise.all([
    fetchPostById(id),
    fetchCategories(),
    listMedia(),
  ]);

  if (!post) notFound();

  return (
    <PostEditor initialPost={post} categories={categories} media={media} />
  );
}
