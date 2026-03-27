import { fetchPostsMetaData, fetchTotalPostsCount } from "@/lib/data";
import PostsList from "@/components/PostsList";
import { PaginationForPages } from "@/components/Pagination";

export default async function Page(props: {
  params: Promise<{ num: string }>;
}) {
  const params = await props.params;
  const num = parseInt(params.num, 10);
  const posts = await fetchPostsMetaData((num - 1) * 7, 7, false, "desc");
  const totalPostsCount = await fetchTotalPostsCount(false);
  const totalPages = Math.ceil(totalPostsCount / 7);

  return (
    <>
      <PostsList title={`ブログ記事一覧（${num}ページ目）`} posts={posts} />
      <div className="my-8 flex justify-center">
        <PaginationForPages
          currentPage={num}
          numPages={totalPages}
          basePath="/pages/"
        />
      </div>
    </>
  );
}
