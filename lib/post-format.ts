// 記事エディタ／保存アクションで共有する純粋ヘルパー。
// サーバー専用（postgres/auth）・クライアント専用（React）の依存を持たないため、
// ブラウザや DB 無しで単体テストできる。

import type { MediaObject } from "@/types/media";

// URL（slug）に許可する文字。半角英数字・ハイフン・アンダースコア・ドットのみ。
export const SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

// "yyyy/MM/dd" を Asia/Tokyo（+09:00）の ISO 文字列に。形式不正なら null。
export function toTokyoISODate(text: string): string | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const pad = (s: string) => s.padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}T00:00:00+09:00`;
}

// 保存キーは media/ 配下なので、表示時は prefix を落とす（media-manager と同様）。
export function mediaDisplayName(key: string): string {
  return key.replace(/^media\//, "");
}

// メディア種別に応じた本文スニペット。
// 画像・動画・音声は同じ `![caption](相対キー "caption")` 記法で挿入し、
// lib/markdown.ts が拡張子から <img>/<video>/<audio> に振り分け、公開 URL への
// 書き換えと title→figcaption 化を行う。その他のファイルはリンクにする。
export function buildMediaSnippet(item: MediaObject, caption: string): string {
  const alt = caption.trim();
  if (item.kind === "other") {
    return `[${alt || mediaDisplayName(item.key)}](${item.url})`;
  }
  return alt ? `![${alt}](${item.key} "${alt}")` : `![](${item.key})`;
}
