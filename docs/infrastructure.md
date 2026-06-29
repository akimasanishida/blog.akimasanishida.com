# インフラ / 環境

> 環境変数の一覧は [`../.env.example`](../.env.example) が source of truth。実値は `.env`（**git 管理外・秘密**）。

## 構成

| 要素 | 本番採用 | 用途 |
| --- | --- | --- |
| PostgreSQL | [Neon](https://neon.com/) | posts / users の永続化。SSL 必須（`ssl: "require"`） |
| S3 互換ストレージ | [Cloudflare R2](https://developers.cloudflare.com/r2/) | 記事内メディア（画像・動画・音声、`media/` prefix）。`@aws-sdk/client-s3` で操作。管理は `/admin/media`（[routing.md](./routing.md)） |
| ホスティング | Vercel 想定（`.gitignore` に `.vercel`） | Next.js のデプロイ |

## 環境変数

[`../.env.example`](../.env.example) を参照（値は記載しない）:

- `DATABASE_URL` — PostgreSQL 接続文字列
- `STORAGE_BUCKET_NAME` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` / `STORAGE_ENDPOINT_URL` — ストレージ接続
- `NEXT_PUBLIC_STORAGE_PUBLIC_URL` — 画像の**公開**閲覧 URL（クライアントに露出。秘密を入れない）
- `NEXT_PUBLIC_SITE_URL` — サイトの公開 URL。`metadataBase`（OG/canonical の絶対 URL 生成）に使用（クライアントに露出。未設定時は本番ドメインにフォールバック）
- `AUTH_SECRET` — next-auth の署名鍵

## セキュリティ上の注意

- `.env` は **git 管理外**（[`../.gitignore`](../.gitignore)）。実値（Neon・R2・AUTH_SECRET）が入るため**読取・出力しない**。
- `NEXT_PUBLIC_` 接頭辞の変数はクライアントへ露出するので、秘密情報を入れないこと。
- 破壊的スクリプト（[`scripts/seed.ts`](../scripts/seed.ts) / [`scripts/storage.ts`](../scripts/storage.ts)）は**ローカル接続先**でのみ実行する（[development.md](./development.md)）。

## デプロイ

- ビルド: `pnpm build`。CI は [`../.github/workflows/check.yaml`](../.github/workflows/check.yaml) で `pnpm lint` を実行。
- 型チェック・テストは CI 未整備（[development.md](./development.md) / [roadmap.md](./roadmap.md) の負債参照）。
