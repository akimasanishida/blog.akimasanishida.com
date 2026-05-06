"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/posts";

function handlePublicStatusChange(post: Post) {
  if (post.is_public) {
    // 公開 → 下書き
    const userResponse = confirm(`「${post.title}」を下書きに変更しますか？`);
    if (userResponse) {
      // TODO: 下書きに変更する処理
    }
  } else {
    // 下書き → 公開
    const userResponse = confirm(`「${post.title}」を公開しますか？`);
    if (userResponse) {
      // TODO: 公開する処理
    }
  }
}

function handleDelete(post: Post) {
  const userResponse = confirm(
    `「${post.title}」を削除しますか？　この操作は取り消せません。`,
  );
  if (userResponse) {
    const userResponse2 = confirm(
      `本気ですか？　「${post.title}」は完全に削除されます。`,
    );
    if (userResponse2) {
      // TODO: 削除する処理
    }
  }
}

export default function PostsTable({ posts }: { posts: Post[] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">タイトル</TableHead>
            <TableHead className="text-center w-[150px]">公開日時</TableHead>
            <TableHead className="text-center w-[150px]">更新日時</TableHead>
            <TableHead className="text-center">カテゴリー</TableHead>
            <TableHead className="text-center w-[100px]">公開/下書き</TableHead>
            <TableHead className="text-center w-[100px]">削除</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-blue-500 hover:underline"
                >
                  {post.title || <span className="italic">（無題）</span>}
                </Link>
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
                  onClick={() => handlePublicStatusChange(post)}
                >
                  {post.is_public ? "公開" : "下書き"}
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="destructive"
                  size="sm"
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
