// 記事エディタ／保存アクションで共有する純粋ヘルパー。
// サーバー専用（postgres/auth）・クライアント専用（React）の依存を持たないため、
// ブラウザや DB 無しで単体テストできる。

import type { MediaObject } from "@/types/media";

// URL（slug）に許可する文字。半角英数字・ハイフン・アンダースコア・ドットのみ。
export const SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

// "yyyy/MM/dd" を Asia/Tokyo（+09:00）の ISO 文字列に。
// 形式不正、または実在しない暦日（例: 2026/02/30, 2026/99/99）は null を返す。
export function toTokyoISODate(text: string): string | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  // 暦日として成立するか検証（月・日の繰り上がりが起きたら不正）。
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  const pad = (s: string) => s.padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}T00:00:00+09:00`;
}

// 保存キーは media/ 配下なので、表示時は prefix を落とす（media-manager と同様）。
export function mediaDisplayName(key: string): string {
  return key.replace(/^media\//, "");
}

// 記事本文(Markdown)から OG/description 用のプレーンテキスト抜粋を作る。
// レンダリング結果ではなく原文を機械的に素朴化するだけ（完全な Markdown 解釈はしない）。
export function buildExcerpt(content: string | null, maxLen = 120): string {
  if (!content) return "";
  const text = content
    .replace(/```[\s\S]*?```/g, " ") // コードフェンス
    .replace(/`[^`]*`/g, " ") // インラインコード
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 画像
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // リンクはテキストだけ残す
    .replace(/<[^>]+>/g, " ") // HTML タグ
    .replace(/^[ \t]*>+[ \t]?/gm, "") // 引用記号
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "") // 見出し
    .replace(/^[ \t]*[-*+][ \t]+/gm, "") // 箇条書き記号
    .replace(/^[ \t]*\d+\.[ \t]+/gm, "") // 番号付きリスト記号
    .replace(/[*_~]/g, "") // 強調・打ち消し記号
    .replace(/\s+/g, " ") // 連続空白・改行を単一スペースへ
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
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
  if (!alt) return `![](${item.key})`;
  // title（"..."）内の " は \" にエスケープしないと Markdown が壊れる。
  const title = alt.replace(/"/g, '\\"');
  return `![${alt}](${item.key} "${title}")`;
}
