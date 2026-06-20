# データモデル

> フィールド定義は **code が source of truth**。ここでは複製せず、リンクと設計根拠のみ記す。
> スキーマ SoT の今後（マイグレーション機構移行）は [decisions/0003](./decisions/0003-schema-sot-and-migration.md) を参照。

## テーブル

- **posts**: アプリ型 [`types/posts.ts`](../types/posts.ts) / DDL [`scripts/seed.ts`](../scripts/seed.ts)（`CREATE TABLE posts`）
- **users**: アプリ型 [`types/users.ts`](../types/users.ts) / DDL [`scripts/seed.ts`](../scripts/seed.ts)（`CREATE TABLE users`）

## クエリ

posts の読み取りは [`lib/data.ts`](../lib/data.ts) に集約:

- `fetchPostBySlug(slug)` — slug で 1 件取得（記事ページ）
- `fetchPostsMetaData(startFrom, numberOfPosts, includeDraft, order, sortBy)` — 一覧（OFFSET/LIMIT・公開/下書き・並び順）
- `fetchTotalPostsCount(includeDraft)` — 総件数（ページ総数算出）

ユーザー取得は認証時のみ（[`auth.ts`](../auth.ts) の `getUser`）。詳細は [auth.md](./auth.md)。

## インデックス設計の根拠

DDL は [`scripts/seed.ts`](../scripts/seed.ts)。各インデックスの**意図**:

- `slug` の **ユニーク**インデックス（自動）: 記事 URL に使うため一意性を保証。
- `(is_public, published_at DESC)` の **複合**インデックス: 公開/非公開を区別しつつ、公開日時順の一覧・バックナンバー表示を高速化。
- `updated_at DESC` インデックス: 管理画面の更新日時順ソート用。
- `category` インデックス: カテゴリー別記事一覧用（🚧 機能は未実装、[roadmap.md](./roadmap.md)）。

## 並び順のフォールバック設計

`fetchPostsMetaData` の `sortBy`:
- `published_at`（既定）: `COALESCE(published_at, created_at)` — 未公開日時は作成日時で代替。
- `updated_at`: `COALESCE(updated_at, published_at, created_at)` — 更新→公開→作成の順にフォールバック。
- `includeDraft` 時は `is_public ASC` を先頭キーにして下書きを区別。
