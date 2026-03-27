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
): Promise<Post[] | null> {
  const direction = order === "asc" ? sql`ASC` : sql`DESC`;

  try {
    const posts = await sql<Post[]>`
      SELECT id, title, slug, created_at, published_at, updated_at, category
      FROM posts
      ${includeDraft ? sql`` : sql`WHERE is_public = true`}
      ORDER BY 
        ${includeDraft ? sql`is_public ASC, ` : sql``}
        published_at ${direction}
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
