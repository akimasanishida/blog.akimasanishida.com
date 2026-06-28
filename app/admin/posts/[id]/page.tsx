import PostEditor from "@/components/admin/PostEditor";
import { MOCK_CATEGORIES, MOCK_IMAGES } from "@/components/admin/mock-data";
import type { Post } from "@/types/posts";

// /admin 配下のため proxy.ts のミドルウェアで自動的に認証保護される。
// モック: 実際の id 取得（fetchPostById）は別フェーズ。今はダミー記事を事前入力する。
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const mockPost: Partial<Post> = {
    id,
    title: "サンプル記事（モック）",
    slug: "sample-post",
    category: "技術",
    content:
      "# 見出し\n\nこれは編集画面のモックです。本文は **Markdown** で書けます。\n\n$E = mc^2$\n\n![笑顔](images/smile.png \"笑顔のキャプション\")\n",
    is_public: true,
    published_at: "2026-06-28T00:00:00+09:00",
  };

  return (
    <PostEditor
      initialPost={mockPost}
      categories={MOCK_CATEGORIES}
      images={MOCK_IMAGES}
    />
  );
}
