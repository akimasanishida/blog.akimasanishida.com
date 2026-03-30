"use client";

import { columns } from "./columns";
import type { Post } from "@/types/posts";
import DataTable from "./data-table";
import { fetchAdminPostsMetaData } from "@/lib/actions";
import { useState, useEffect } from "react";

export function PostsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);

  const postsPerPage = 7;
  
  useEffect(() => {
    async function loadPosts() {
      const startFrom = (currentPage - 1) * postsPerPage;
      const fetchedPosts = await fetchAdminPostsMetaData(
        startFrom,
        postsPerPage,
        true,
        "desc"
      );
      setPosts(fetchedPosts || []);
    }

    loadPosts();
  }, [currentPage]);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={posts} />
    </div>
  );
}
