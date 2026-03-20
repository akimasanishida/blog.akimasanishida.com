import postgres from "postgres";
import type { Post } from "@/types/posts";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

export async function getPostBySlug(slug: string): Promise<Post | null> {
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
