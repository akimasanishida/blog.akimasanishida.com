import { fetchPostsMetaData } from "@/lib/data";
import PostsList from "@/components/PostsList";

export default async function Page() {
  const posts = await fetchPostsMetaData(0, 7, false, "desc");

  return (
    <PostsList title="ブログ記事一覧" posts={posts} />
  );
}
