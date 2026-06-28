# アーキテクチャ

> 事実（構成・関数）は code が source of truth。本書は全体像と設計意図を述べる。

## 技術スタック

- **Next.js 16 App Router**（React 19 / TypeScript strict） — SSR/RSC ベース
- **PostgreSQL**（本番 [Neon](https://neon.com/)） — `postgres` パッケージで直接アクセス（ORM なし）
- **S3 互換ストレージ**（本番 [Cloudflare R2](https://developers.cloudflare.com/r2/)） — 記事内メディア（画像・動画・音声）
- **認証**: next-auth v5（beta）+ bcrypt
- **UI**: shadcn（[`../components.json`](../components.json)・style `radix-nova`） + Tailwind CSS v4
- **Markdown**: unified/remark/rehype パイプライン

## レイヤ構成

| レイヤ | 場所 | 役割 |
| --- | --- | --- |
| ルーティング/ページ | [`../app/`](../app/) | App Router のページ・レイアウト（RSC） |
| UI コンポーネント | [`../components/`](../components/) | 表示部品。`components/ui/` は shadcn |
| データアクセス | [`../lib/data.ts`](../lib/data.ts) | posts の読み取りクエリ（`postgres` タグ付きテンプレート） |
| Server Actions | [`../lib/actions.ts`](../lib/actions.ts) | フォーム処理（ログイン等） |
| ドメインユーティリティ | [`../lib/markdown.ts`](../lib/markdown.ts) / [`../lib/definitions.ts`](../lib/definitions.ts) / [`../lib/utils.ts`](../lib/utils.ts) | Markdown 変換 / 日付書式(Asia/Tokyo) / `cn()` |
| 型 | [`../types/`](../types/) | `Post` / `User`（アプリ型の SoT） |
| 認証 | [`../auth.ts`](../auth.ts) / [`../auth.config.ts`](../auth.config.ts) / [`../proxy.ts`](../proxy.ts) | next-auth 設定とミドルウェア |
| 運用スクリプト | [`../scripts/`](../scripts/) | `seed.ts`（スキーマ+モック投入）/ `storage.ts`（画像アップロード） |

## データフロー

### 公開: 記事一覧（トップ `/?page=`）
1. [`app/page.tsx`](../app/page.tsx)（RSC）が `searchParams.page` を読む。
2. [`fetchPostsMetaData()`](../lib/data.ts) で公開記事を OFFSET/LIMIT 取得、[`fetchTotalPostsCount()`](../lib/data.ts) で総数取得。
3. `PostsList` で一覧、`PaginationForPages`（[`components/Pagination.tsx`](../components/Pagination.tsx)）でページ送り。
   詳細は [routing.md](./routing.md)・[decisions/0001](./decisions/0001-pagination-searchparams.md)。

### 公開: 個別記事（`/posts/[slug]`）
1. [`app/posts/[slug]/page.tsx`](../app/posts/%5Bslug%5D/page.tsx) が [`fetchPostBySlug()`](../lib/data.ts) で取得（無ければ `notFound()`）。
2. [`renderMarkdownToHTML()`](../lib/markdown.ts) で本文を HTML 化し `dangerouslySetInnerHTML` で描画。
   パイプライン詳細は [content-pipeline.md](./content-pipeline.md)。

### 管理: `/admin`（認証必須）
- [`proxy.ts`](../proxy.ts) のミドルウェアが `/admin/*` を保護。未ログインは `/login` へ。詳細は [auth.md](./auth.md)。
- `/admin/media`: R2 メディアの一覧・アップロード・削除・リネーム（[`lib/storage.ts`](../lib/storage.ts) / [routing.md](./routing.md)）。

## 設計上の要点
- **ORM を使わず** `postgres` のタグ付きテンプレートで SQL を直接記述（`${}` 補間で自動エスケープ）。
- 公開/非公開は `is_public` で制御し、一覧クエリは既定で `WHERE is_public = true`。
- スキーマの一元管理（SoT）は現状 code 依存。マイグレーション機構移行は [decisions/0003](./decisions/0003-schema-sot-and-migration.md) 参照。
