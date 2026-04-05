import { fetchPostsMetaData } from "@/lib/data";
import DataTable from "./data-table";
import { columns } from "./columns";

export default async function Page(props: {
  searchParams?: Promise<{
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const postsPerPage = 7;
  const startPostsFrom = (page - 1) * postsPerPage;
  const posts =
    (await fetchPostsMetaData(startPostsFrom, postsPerPage, true, "desc")) ||
    [];

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={posts} />
    </div>
  );
}
