# ロードマップ

未実装の構想と既知の負債。実装したら [routing.md](./routing.md) のサイトマップへ「✅＋リンク」で昇格させる。
（GitHub Issue との突き合わせ: 2026-06-20 時点）

## 進行中 — 管理画面の書き込み系（Issue あり）

`/admin` は現状**閲覧のみ**。以下が実装されると本来の「投稿・編集」管理画面になる。

| 機能 | Issue | 備考 |
| --- | --- | --- |
| 記事の DB 書き込み | #12（umbrella #1） | 読み取りは実装済み（#11） |
| 画像のストレージ書き込み | #18（umbrella #4） | 読み取り・表示は実装済み（#16, #17, #5） |
| 記事の新規追加・編集 UI | #9 | 管理画面からの編集 |
| 画像管理 UI | #10 | 管理画面からの画像管理 |
| 管理画面（umbrella） | #6 | 記事一覧 #8・ナビ #21 は完了 |

## その他の Issue（あり）

| 機能 | Issue | 優先度 |
| --- | --- | --- |
| フッターの追加 | #25 | — |
| メタデータの付与 | #24 | — |
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
