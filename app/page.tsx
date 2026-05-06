import { fetchPostsMetaData, fetchTotalPostsCount } from "@/lib/data";
import PostsList from "@/components/PostsList";
import { PaginationForPages } from "@/components/Pagination";

export default async function Page(props: {
  searchParams?: Promise<{
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const postsPerPage = 7;
  const startPostsFrom = (page - 1) * postsPerPage;
  const posts = await fetchPostsMetaData(startPostsFrom, postsPerPage, false, "desc");
  const totalPostsCount = await fetchTotalPostsCount(false);
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);

  const pageTitle = searchParams?.page ? `ブログ記事一覧（${page}ページ目）` : "ブログ記事一覧";

  return (
    <>
      <PostsList title={pageTitle} posts={posts} />
      <div className="my-8 flex justify-center">
        <PaginationForPages
          currentPage={page}
          numPages={totalPages}
          currentUrl=""
          currentSearchParams={new URLSearchParams(searchParams)}
        />
      </div>
    </>
  );
}
