"use server";

import { renderMarkdownToHTML } from "@/lib/markdown";

// プレビュー用に Markdown を HTML 化するだけの軽量アクション（永続化なし）。
// 公開記事と同じ lib/markdown.ts のパイプライン（KaTeX/Prism/画像 URL 書き換え）を再利用する。
export async function renderPreview(markdown: string): Promise<string> {
  return renderMarkdownToHTML(markdown);
}
