"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deletePostAction, togglePublicAction } from "@/lib/post-actions";
import type { Post } from "@/types/posts";

type SortKey = "published_at" | "updated_at";
type Order = "asc" | "desc";

function SortableHeader({
  label,
  column,
  className,
  sortBy,
  order,
}: {
  label: string;
  column: SortKey;
  className?: string;
  sortBy: SortKey;
  order: Order;
}) {
  const isActive = sortBy === column;
  // 同じ列なら昇順/降順をトグル、別の列なら降順から開始
  const nextOrder: Order = isActive && order === "desc" ? "asc" : "desc";
  const params = new URLSearchParams({
    sort: column,
    order: nextOrder,
    page: "1",
  });

  return (
    <TableHead className={className}>
      <Link
        href={`/admin?${params.toString()}`}
        className="inline-flex items-center justify-center gap-1 hover:underline"
      >
        {label}
        {isActive &&
          (order === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </Link>
    </TableHead>
  );
}

export default function PostsTable({
  posts,
  sortBy,
  order,
}: {
  posts: Post[];
  sortBy: SortKey;
  order: Order;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePublicStatusChange(post: Post) {
    if (!post.id) return;
    const id = post.id;
    const next = !post.is_public;
    const message = post.is_public
      ? `「${post.title}」を下書きに変更しますか？`
      : `「${post.title}」を公開しますか？`;
    if (!confirm(message)) return;
    startTransition(async () => {
      const result = await togglePublicAction(id, next);
      if (result?.status === "error") {
        alert(result.message);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(post: Post) {
    if (!post.id) return;
    const id = post.id;
    if (!confirm(`「${post.title}」を削除しますか？　この操作は取り消せません。`)) {
      return;
    }
    if (!confirm(`本気ですか？　「${post.title}」は完全に削除されます。`)) {
      return;
    }
    startTransition(async () => {
      const result = await deletePostAction(id);
      if (result?.status === "error") {
        alert(result.message);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">タイトル</TableHead>
            <SortableHeader
              label="公開日時"
              column="published_at"
              className="text-center w-[150px]"
              sortBy={sortBy}
              order={order}
            />
            <SortableHeader
              label="更新日時"
              column="updated_at"
              className="text-center w-[150px]"
              sortBy={sortBy}
              order={order}
            />
            <TableHead className="text-center">カテゴリー</TableHead>
            <TableHead className="text-center w-[100px]">公開/下書き</TableHead>
            <TableHead className="text-center w-[100px]">削除</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {post.title || <span className="italic">（無題）</span>}
                  </Link>
                  {post.is_public && post.slug && (
                    <Link
                      href={`/posts/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="公開ページを新しいタブで開く"
                      title="公開ページを開く"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </span>
              </TableCell>
              <TableCell>
                {post.published_at
                  ? new Date(post.published_at).toLocaleString("ja-JP")
                  : "―"}
              </TableCell>
              <TableCell>
                {post.updated_at
                  ? new Date(post.updated_at).toLocaleString("ja-JP")
                  : "―"}
              </TableCell>
              <TableCell>{post.category || "―"}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => handlePublicStatusChange(post)}
                >
                  {post.is_public ? "公開" : "下書き"}
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(post)}
                >
                  削除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
