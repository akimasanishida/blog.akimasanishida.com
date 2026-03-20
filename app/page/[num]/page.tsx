import Link from "next/link";
import { fetchPostsMetaData } from "@/lib/data";

export default async function Page(props: { params: Promise<{ num: string }> },
) {
  const params = await props.params;
  const num = parseInt(params.num, 10);
  const posts = await fetchPostsMetaData((num - 1) * 7, 7, false, "desc");
  return (
    <div>
      <h1>ブログ記事一覧</h1>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link> -{" "}
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString()
              : "公開日時不明"}{" "}
            - カテゴリー: {post.category}
          </li>
        ))}
      </ul>
    </div>
  );
}
