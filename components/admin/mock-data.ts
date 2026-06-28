// モック用のダミーデータ。
// 本実装では以下に差し替える想定:
//   - カテゴリー候補: posts から `SELECT DISTINCT category` を取得（lib/data.ts に関数追加）
//   - 画像一覧: R2/S3 の `ListObjectsV2` ラッパを lib に追加（scripts/storage.ts と同じ認証情報）
// 詳細は Issue #9 / plan を参照。

export const MOCK_CATEGORIES: string[] = [
  "日記",
  "技術",
  "数学",
  "読書",
  "旅行",
];

export type MockImage = {
  /** 本文 Markdown に書き込む相対キー（例: "images/smile.png"）。lib/markdown.ts が公開 URL を前置する */
  key: string;
  /** オーバーレイのサムネイル表示用 URL */
  url: string;
};

// サムネイルは公開ストレージ URL（未設定ならプレースホルダ）を使う。
const storageBase = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? "";

export const MOCK_IMAGES: MockImage[] = [
  "images/smile.png",
  "images/mountain.jpg",
  "images/code.png",
  "images/cat.jpg",
  "images/graph.png",
  "images/sea.jpg",
].map((key) => ({
  key,
  url: storageBase ? `${storageBase}/${key}` : `https://placehold.co/240x160?text=${encodeURIComponent(key)}`,
}));
