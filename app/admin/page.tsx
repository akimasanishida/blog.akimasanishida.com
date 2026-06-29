import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { fetchPostsMetaData, fetchTotalPostsCount } from "@/lib/data";
import PostsTable from "./data-table";
import { PaginationForPages } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "記事管理" };

export default async function Page(props: {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const sortBy = searchParams?.sort === "updated_at" ? "updated_at" : "published_at";
  const order = searchParams?.order === "asc" ? "asc" : "desc";
  const postsPerPage = 7;
  const startPostsFrom = (page - 1) * postsPerPage;
  const totalPostsCount = await fetchTotalPostsCount(true);
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);
  const posts =
    (await fetchPostsMetaData(startPostsFrom, postsPerPage, true, order, sortBy)) ||
    [];

  return (
    <div className="flex flex-col container mx-auto py-10 gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">記事一覧</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/media">
              <ImageIcon />
              メディア管理
            </Link>
          </Button>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus />
            新規作成
          </Link>
        </Button>
      </div>
      <PostsTable posts={posts} sortBy={sortBy} order={order} />
      <PaginationForPages
        currentPage={page}
        numPages={totalPages}
        currentUrl="/admin"
        currentSearchParams={new URLSearchParams(searchParams)}
      />
    </div>
  );
}
