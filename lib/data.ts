import postgres from "postgres";
import type { Post } from "@/types/posts";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await sql<Post[]>`
      SELECT *
      FROM posts
      WHERE slug = ${slug}
    `;
    return post[0];
  } catch (error) {
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
      SELECT id, title, slug, published_at, updated_at, category
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
    console.error(error);
    throw new Error("Failed to fetch posts metadata");
  }
}
