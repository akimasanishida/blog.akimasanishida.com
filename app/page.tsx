import { fetchPostsMetaData, fetchTotalPostsCount } from "@/lib/data";
import PostsList from "@/components/PostsList";
import { PaginationForPages } from "@/components/Pagination";

export default async function Page() {
  const posts = await fetchPostsMetaData(0, 7, false, "desc");
  const totalPostsCount = await fetchTotalPostsCount(false);
  const totalPages = Math.ceil(totalPostsCount / 7);

  return (
    <>
      <PostsList title="ブログ記事一覧" posts={posts} />
      <div className="my-8 flex justify-center">
        <PaginationForPages
          currentPage={1}
          numPages={totalPages}
          basePath="/pages/"
        />
      </div>
    </>
  );
}
