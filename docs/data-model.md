# データモデル

> フィールド定義は **code が source of truth**。ここでは複製せず、リンクと設計根拠のみ記す。
> スキーマ SoT の今後（マイグレーション機構移行）は [decisions/0003](./decisions/0003-schema-sot-and-migration.md) を参照。

## テーブル

- **posts**: アプリ型 [`types/posts.ts`](../types/posts.ts) / DDL [`scripts/seed.ts`](../scripts/seed.ts)（`CREATE TABLE posts`）
- **users**: アプリ型 [`types/users.ts`](../types/users.ts) / DDL [`scripts/seed.ts`](../scripts/seed.ts)（`CREATE TABLE users`）

## メディア（DB 外）

画像・動画・音声は **DB ではなく S3 互換ストレージ（本番 R2）** に保存し、メタデータ用テーブルは持たない。
保存先はバケット内の `media/` prefix（= media フォルダ）に統一。一覧は `ListObjectsV2`（`Prefix: media/`）で
直接走査して取得する（取得元: [`lib/storage.ts`](../lib/storage.ts)、
アプリ型 [`types/media.ts`](../types/media.ts)）。管理は `/admin/media`（[routing.md](./routing.md)）。
Markdown 内の参照パス→公開 URL 変換は [`lib/markdown.ts`](../lib/markdown.ts)。

## クエリ

posts の読み取り・書き込みは [`lib/data.ts`](../lib/data.ts) に集約:

- `fetchPostBySlug(slug)` — slug で 1 件取得（記事ページ）
- `fetchPostById(id)` — id で 1 件取得（編集ページ。不正 UUID は null）
- `fetchPostsMetaData(startFrom, numberOfPosts, includeDraft, order, sortBy)` — 一覧（OFFSET/LIMIT・公開/下書き・並び順）
- `fetchTotalPostsCount(includeDraft)` — 総件数（ページ総数算出）
- `fetchCategories()` — カテゴリー候補（`DISTINCT category`）
- `createPost` / `updatePost` / `deletePost` / `setPostPublic` — 記事 CRUD と公開トグル（#9）

書き込みは Server Action [`lib/post-actions.ts`](../lib/post-actions.ts)（`savePost`/`deletePostAction`/`togglePublicAction`）を
経由し、各アクションは [`auth.ts`](../auth.ts) の `auth()` で多層防御する。slug 一意制約違反（23505）は
アクション側で文言化する。ユーザー取得は認証時のみ（`auth.ts` の `getUser`）。詳細は [auth.md](./auth.md)。

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
