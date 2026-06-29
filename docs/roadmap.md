# ロードマップ

未実装の構想と既知の負債。実装したら [routing.md](./routing.md) のサイトマップへ「✅＋リンク」で昇格させる。
（GitHub Issue との突き合わせ: 2026-06-20 時点）

## 進行中 — 管理画面の書き込み系（Issue あり）

`/admin` から記事の新規作成・編集・公開/下書き切替・削除が可能（#9・#12）。メディア管理 `/admin/media` も実装済み（#18）。

| 機能 | Issue | 備考 |
| --- | --- | --- |
| 記事の DB 書き込み | #12（umbrella #1） | 実装済み。書き込みは [`lib/post-actions.ts`](../lib/post-actions.ts) |
| 記事の新規追加・編集 UI | #9 | 実装済み。[`components/admin/PostEditor.tsx`](../components/admin/PostEditor.tsx) |
| 画像管理 UI | #10 | `/admin/media`（#18）で実装済み。クローズ可否は要確認 |
| 管理画面（umbrella） | #6 | 記事一覧 #8・ナビ #21・メディア管理 #18・記事 CRUD #9/#12 は完了 |

## その他の Issue（あり）

| 機能 | Issue | 優先度 |
| --- | --- | --- |
| フッターの追加 | #25 | — |
| メタデータの付与 | #24 | 実装済み。`app/layout.tsx` の既定＋各ページ `metadata`/`generateMetadata` |
| ファビコンの変更 | #23 | — |

## 未実装の構想（Issue 未作成）

実装着手時は Issue を起票してから [routing.md](./routing.md) のサイトマップへ昇格させる。

| 機能 | 優先度 | 設計意図 |
| --- | --- | --- |
| 検索 `/search?q=` | 中 | タイトル/本文のキーワード検索。将来は全文検索（tsvector 等）を検討。 |
| カテゴリー `/categories/[category]` | 低 | `category` インデックスを活用した分類導線（[data-model.md](./data-model.md)）。 |
| アーカイブ `/archives/[year]`・`/[year]/[month]` | 低 | 公開日時ベースのバックナンバー導線。 |

## 既知の負債

| 項目 | 内容 | 関連 |
| --- | --- | --- |
| テスト未整備 | テストフレームワーク無し。CI は `pnpm lint` のみ（型チェック・テスト無し）。 | [`../.github/workflows/check.yaml`](../.github/workflows/check.yaml) |
| next-auth beta | v5 beta に固定。破壊的変更に注意。 | [auth.md](./auth.md) |
| スキーマ SoT | DDL が `scripts/seed.ts` の `CREATE TABLE IF NOT EXISTS` 依存。マイグレーション機構へ移行検討。 | [decisions/0003](./decisions/0003-schema-sot-and-migration.md) |
