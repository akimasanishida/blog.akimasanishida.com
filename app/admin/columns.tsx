"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Post } from "@/types/posts";
import { optionsLocaleString } from "@/lib/definitions";

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "title",
    header: "タイトル",
  },
  {
    accessorKey: "published_at",
    header: "公開日時",
    cell: ({ row }) => {
      const publishedAt =row.getValue("published_at");
      if (!publishedAt) return "―";
      return new Date(String(publishedAt)).toLocaleString("ja-JP", optionsLocaleString);
    },
  },
  {
    accessorKey: "updated_at",
    header: "更新日時",
    cell: ({ row }) => {
      const updatedAt = row.getValue("updated_at");
      if (!updatedAt) return "―";
      return new Date(String(updatedAt)).toLocaleString("ja-JP", optionsLocaleString);
    },
  },
  {
    accessorKey: "category",
    header: "カテゴリー",
  },
  {
    accessorKey: "is_public",
    header: "公開/下書き",
    cell: ({ row }) => {
      const isPublic = row.getValue("is_public");
      return isPublic ? "公開" : "下書き";
    },
  },
];
