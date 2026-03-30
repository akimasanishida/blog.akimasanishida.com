"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Post } from "@/types/posts";

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "title",
    header: "タイトル",
  },
  {
    accessorKey: "published_at",
    header: "公開日時",
  },
  {
    accessorKey: "updated_at",
    header: "更新日時",
  },
  {
    accessorKey: "category",
    header: "カテゴリー",
  },
  {
    accessorKey: "is_public",
    header: "公開/下書き",
  }
]