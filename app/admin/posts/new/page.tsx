import type { Metadata } from "next";
import PostEditor from "@/components/admin/PostEditor";
import { fetchCategories } from "@/lib/data";
import { listMedia } from "@/lib/storage";

export const metadata: Metadata = { title: "記事の新規作成" };

// /admin 配下のため proxy.ts のミドルウェアで自動的に認証保護される。
export default async function Page() {
  const [categories, media] = await Promise.all([
    fetchCategories(),
    listMedia(),
  ]);

  return <PostEditor categories={categories} media={media} />;
}
