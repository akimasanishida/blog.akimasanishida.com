import postgres from "postgres";
import { cache } from "react";
import type { Post } from "@/types/posts";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

// generateMetadata と Page で同一リクエスト中に二重に呼ばれるため、
// React cache で重複クエリを排除する。
export const fetchPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    try {
      const post = await sql<Post[]>`
        SELECT id, title, slug, created_at, published_at, updated_at, category, content, is_public
        FROM posts
        WHERE slug = ${slug}
      `;
      return post[0];
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      throw new Error("Failed to fetch post by slug");
    }
  },
);

export async function fetchPostsMetaData(
  startFrom: number,
  numberOfPosts: number,
  includeDraft: boolean = false,
  order: "asc" | "desc" = "desc",
  sortBy: "published_at" | "updated_at" = "published_at",
): Promise<Post[] | null> {
  const direction = order === "asc" ? sql`ASC` : sql`DESC`;
  // 更新日時ソートは updated_at → published_at → created_at の順でフォールバック
  // （公開済み未更新は published_at、下書きは created_at に落ちる）
  const sortExpr =
    sortBy === "updated_at"
      ? sql`COALESCE(updated_at, published_at, created_at)`
      : sql`COALESCE(published_at, created_at)`;

  try {
    const posts = await sql<Post[]>`
      SELECT id, title, slug, created_at, published_at, updated_at, category, is_public
      FROM posts
      ${includeDraft ? sql`` : sql`WHERE is_public = true`}
      ORDER BY
        ${includeDraft ? sql`is_public ASC, ` : sql``}
        ${sortExpr} ${direction}
      OFFSET ${Math.max(0, startFrom)}
      LIMIT ${numberOfPosts}
    `;
    return posts;
  } catch (error) {
    console.error("Error fetching posts metadata:", error);
    throw new Error("Failed to fetch posts metadata");
  }
}

export async function fetchTotalPostsCount(
  includeDraft: boolean = false,
): Promise<number> {
  try {
    const result = await sql<{ count: number }[]>`
      SELECT COUNT(*) AS count
      FROM posts
      ${includeDraft ? sql`` : sql`WHERE is_public = true`}
    `;
    return result[0].count;
  } catch (error) {
    console.error("Error fetching total posts count:", error);
    throw new Error("Failed to fetch total posts count");
  }
}

export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    const post = await sql<Post[]>`
      SELECT id, title, slug, created_at, published_at, updated_at, category, content, is_public
      FROM posts
      WHERE id = ${id}
    `;
    return post[0] ?? null;
  } catch (error) {
    // 不正な UUID 文字列（22P02）は「存在しない」とみなして null を返す。
    if ((error as { code?: string }).code === "22P02") return null;
    console.error("Error fetching post by id:", error);
    throw new Error("Failed to fetch post by id");
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const rows = await sql<{ category: string }[]>`
      SELECT DISTINCT category
      FROM posts
      WHERE category IS NOT NULL AND category <> ''
      ORDER BY category
    `;
    return rows.map((r) => r.category);
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

// slug が使用可能（未使用）かを返す。編集時は自分自身（excludeId）を除外する。
export async function isSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const rows = await sql<{ taken: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM posts
        WHERE slug = ${slug}
        ${excludeId ? sql`AND id <> ${excludeId}` : sql``}
      ) AS taken
    `;
    return !rows[0].taken;
  } catch (error) {
    console.error("Error checking slug availability:", error);
    throw new Error("Failed to check slug availability");
  }
}

// 記事の作成・更新で受け取る値。created_at/updated_at は DB 側で管理する。
export type PostWriteInput = {
  title: string | null;
  slug: string;
  category: string | null;
  content: string | null;
  published_at: string | null; // ISO 文字列（Asia/Tokyo で整形済み）または null
  is_public: boolean;
};

// 作成。slug 一意制約違反（23505）は呼び出し側（lib/post-actions.ts）で文言化するため、
// ここでは postgres のエラーをそのまま伝播させる。
export async function createPost(
  input: PostWriteInput,
): Promise<{ id: string; slug: string }> {
  const rows = await sql<{ id: string; slug: string }[]>`
    INSERT INTO posts (title, slug, category, content, published_at, is_public)
    VALUES (${input.title}, ${input.slug}, ${input.category}, ${input.content}, ${input.published_at}, ${input.is_public})
    RETURNING id, slug
  `;
  return rows[0];
}

// 更新。updated_at（更新日時）は「既に公開済みだった記事を編集したとき」だけ進める。
// 初回公開（下書き→公開）では押さない（その時刻は published_at が表す）。
// UPDATE の SET 右辺の列参照は更新前の値なので、ここでの is_public は旧値。
export async function updatePost(
  id: string,
  input: PostWriteInput,
): Promise<void> {
  await sql`
    UPDATE posts
    SET title = ${input.title},
        slug = ${input.slug},
        category = ${input.category},
        content = ${input.content},
        published_at = ${input.published_at},
        is_public = ${input.is_public},
        updated_at = CASE WHEN is_public THEN NOW() ELSE updated_at END
    WHERE id = ${id}
  `;
}

export async function deletePost(id: string): Promise<void> {
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

// 一覧からの公開/下書きトグル。下書き→公開で published_at が未設定なら現在時刻を入れる。
// 公開状態の切替は本文編集ではないため updated_at は触らない（初回公開で更新スタンプを押さない）。
export async function setPostPublic(
  id: string,
  isPublic: boolean,
): Promise<void> {
  await sql`
    UPDATE posts
    SET is_public = ${isPublic},
        published_at = CASE
          WHEN ${isPublic} AND published_at IS NULL THEN NOW()
          ELSE published_at
        END
    WHERE id = ${id}
  `;
}
