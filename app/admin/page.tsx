import { fetchPostsMetaData, fetchTotalPostsCount } from "@/lib/data";
import PostsTable from "./data-table";
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
  const totalPostsCount = await fetchTotalPostsCount(true);
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);
  const posts =
    (await fetchPostsMetaData(startPostsFrom, postsPerPage, true, "desc")) ||
    [];

  return (
    <div className="flex flex-col container mx-auto py-10 gap-8">
      <PostsTable posts={posts} />
      <PaginationForPages
        currentPage={page}
        numPages={totalPages}
        currentUrl="/admin"
        currentSearchParams={new URLSearchParams(searchParams)}
      />
    </div>
  );
}
