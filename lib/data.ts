import postgres from "postgres";
import type { Post } from "@/types/posts";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
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
}

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
