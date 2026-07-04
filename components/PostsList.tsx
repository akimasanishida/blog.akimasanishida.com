import Link from "next/link";
import type { Post } from "@/types/posts";
import PostMetadata from "@/components/PostMetadata";

export default function PostsList({title, posts}: { title: string; posts: Post[] | null }) {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-4xl mb-4">{title}</h1>
        <hr className="border-t border-(--border)" />
      </header>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>
            {/* URL 未設定の記事はリンクにしない（多層防御。通常は公開時に URL 必須） */}
            {post.slug ? (
              <Link href={`/posts/${post.slug}`}>
                <h2 className="text-2xl text-blue-500 mb-3">{post.title}</h2>
              </Link>
            ) : (
              <h2 className="text-2xl mb-3">{post.title}</h2>
            )}
            <PostMetadata
              publishedAt={post.published_at}
              updatedAt={post.updated_at}
              category={post.category}
            />
            <hr className="border-t border-(--border) my-4" />
          </li>
        ))}
      </ul>
    </div>
  );
}
