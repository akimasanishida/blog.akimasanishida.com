// lib/markdown.ts はメディアの相対キーをこの公開 URL で絶対化する。
// テストでは固定値にして出力を検証しやすくする。
process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL = "https://cdn.example.test";
