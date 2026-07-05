import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPostById } from "@/lib/data";

export const metadata: Metadata = { title: "投稿完了" };

// /admin 配下のため app/admin/layout.tsx の auth() ガードで認証保護される。
export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await props.params;
  const { updated } = await props.searchParams;

  const post = await fetchPostById(id);
  if (!post) notFound();
  // 完了ページは公開/更新後（is_public=true）にのみ遷移してくる。下書き id で
  // 直接アクセスされた場合は「公開しました」と食い違うため 404 にする。
  if (!post.is_public) notFound();

  const canView = Boolean(post.slug);
  // 既存記事の更新は savePost が ?updated=1 を付けて遷移してくる。
  const action = updated ? "更新" : "公開";

  return (
    <div className="container mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">投稿が完了しました</h1>
        <p className="text-muted-foreground">
          「{post.title ?? "無題"}」を{action}しました。
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {canView && (
          <Button asChild>
            <Link href={`/posts/${post.slug}`}>記事を見る</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/admin">管理画面トップに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
