"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createPost,
  updatePost,
  deletePost,
  setPostPublic,
  isSlugAvailable,
} from "@/lib/data";
import { SLUG_PATTERN, toTokyoISODate } from "@/lib/post-format";

export type PostActionState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

export type SavePostInput = {
  /** 既存記事なら id。新規作成時は省略 */
  id?: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  /** 公開日テキスト（yyyy/MM/dd） */
  publishedAtText: string;
  /** 下書き保存 or 公開（既存公開記事の「更新」も publish 扱い） */
  intent: "draft" | "publish";
};

export type SlugCheckResult =
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid" }
  | { status: "empty" };

// URL（slug）の重複チェック。エディタの入力中チェック用（デバウンスは呼び出し側）。
export async function checkSlugAvailability(
  slug: string,
  excludeId?: string,
): Promise<SlugCheckResult> {
  const session = await auth();
  if (!session) return { status: "invalid" };

  const trimmed = slug.trim();
  if (!trimmed) return { status: "empty" };
  if (!SLUG_PATTERN.test(trimmed)) return { status: "invalid" };

  return (await isSlugAvailable(trimmed, excludeId))
    ? { status: "available" }
    : { status: "taken" };
}

export async function savePost(input: SavePostInput): Promise<PostActionState> {
  // /admin はレイアウトの auth() ガードで保護されるが、書き込みは多層防御として再確認する。
  const session = await auth();
  if (!session) return { status: "error", message: "認証が必要です。" };

  const title = input.title.trim();
  const slug = input.slug.trim();
  const category = input.category.trim();
  const publish = input.intent === "publish";

  if (!slug) {
    return { status: "error", message: "URL（slug）を入力してください。" };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      status: "error",
      message:
        "URL は半角英数字・ハイフン・アンダースコア・ドットのみ使用できます。",
    };
  }
  if (publish && !title) {
    return { status: "error", message: "公開するにはタイトルが必要です。" };
  }

  let publishedAt = toTokyoISODate(input.publishedAtText);
  if (input.publishedAtText.trim() && publishedAt === null) {
    return {
      status: "error",
      message: "公開日は 2026/06/28 形式で入力してください。",
    };
  }
  // 公開で日付未指定なら現在時刻を公開日時にする。
  if (publish && publishedAt === null) publishedAt = new Date().toISOString();

  const data = {
    title: title || null,
    slug,
    category: category || null,
    content: input.content || null,
    published_at: publishedAt,
    is_public: publish,
  };

  let newId: string | undefined;
  try {
    if (input.id) {
      await updatePost(input.id, data);
    } else {
      newId = (await createPost(data)).id;
    }
  } catch (error) {
    // slug UNIQUE 制約違反
    if ((error as { code?: string }).code === "23505") {
      return {
        status: "error",
        message: `URL「${slug}」は既に使われています。別の URL を指定してください。`,
      };
    }
    console.error("Failed to save post:", error);
    return { status: "error", message: "保存に失敗しました。" };
  }

  revalidatePath("/admin");
  if (data.is_public) {
    revalidatePath("/");
    revalidatePath(`/posts/${slug}`);
  }

  // 新規作成後は編集ページへ遷移し、以後は更新として扱う。
  // redirect は NEXT_REDIRECT を throw するため try/catch の外で呼ぶ。
  if (newId) redirect(`/admin/posts/${newId}`);

  return {
    status: "success",
    message: publish ? "公開しました。" : "下書きを保存しました。",
  };
}

export async function deletePostAction(id: string): Promise<PostActionState> {
  const session = await auth();
  if (!session) return { status: "error", message: "認証が必要です。" };

  try {
    await deletePost(id);
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { status: "error", message: "削除に失敗しました。" };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { status: "success", message: "削除しました。" };
}

export async function togglePublicAction(
  id: string,
  isPublic: boolean,
): Promise<PostActionState> {
  const session = await auth();
  if (!session) return { status: "error", message: "認証が必要です。" };

  try {
    await setPostPublic(id, isPublic);
  } catch (error) {
    console.error("Failed to toggle post visibility:", error);
    return { status: "error", message: "公開状態の変更に失敗しました。" };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return {
    status: "success",
    message: isPublic ? "公開しました。" : "下書きに戻しました。",
  };
}
