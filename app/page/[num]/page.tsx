import { fetchPostsMetaData } from "@/lib/data";
import PostsList from "@/components/PostsList";

export default async function Page(props: { params: Promise<{ num: string }> },
) {
  const params = await props.params;
  const num = parseInt(params.num, 10);
  const posts = await fetchPostsMetaData((num - 1) * 7, 7, false, "desc");
  return (
    <PostsList title={`ブログ記事一覧（${num}ページ目）`} posts={posts} />
  );
}
