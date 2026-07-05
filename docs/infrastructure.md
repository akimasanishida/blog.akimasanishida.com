# インフラ / 環境

> 環境変数の一覧は [`../.env.example`](../.env.example) が source of truth。実値は `.env`（**git 管理外・秘密**）。

## 構成

| 要素 | 本番採用 | 用途 |
| --- | --- | --- |
| PostgreSQL | [Neon](https://neon.com/) | posts / users の永続化。Workers からは [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) 経由で接続（[`../lib/db.ts`](../lib/db.ts)）。直結時のみ SSL 必須 |
| S3 互換ストレージ | [Cloudflare R2](https://developers.cloudflare.com/r2/) | 記事内メディア（画像・動画・音声、`media/` prefix）。`@aws-sdk/client-s3` で操作。管理は `/admin/media`（[routing.md](./routing.md)）。**公開閲覧**はカスタムドメイン `cdn.blog.akimasanishida.com` 経由（`NEXT_PUBLIC_STORAGE_PUBLIC_URL`） |
| ホスティング | [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [OpenNext](https://opennext.js.org/cloudflare)（`@opennextjs/cloudflare`） | Next.js のデプロイ。設定は [`../wrangler.jsonc`](../wrangler.jsonc) / [`../open-next.config.ts`](../open-next.config.ts) |

## 環境変数

[`../.env.example`](../.env.example) を参照（値は記載しない）:

- `DATABASE_URL` — PostgreSQL 接続文字列（ローカル dev/test・`scripts/*.ts` 用。本番 Workers は Hyperdrive バインディング経由のため不要）
- `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` — ローカルの dev/build で Hyperdrive をエミュレートする接続文字列（`pnpm dev` / `preview` / `deploy` のビルド時に必要）
- `STORAGE_BUCKET_NAME` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` / `STORAGE_ENDPOINT_URL` — ストレージ接続
- `NEXT_PUBLIC_STORAGE_PUBLIC_URL` — 画像の**公開**閲覧 URL（クライアントに露出。秘密を入れない）。本番は R2 のカスタムドメイン `https://cdn.blog.akimasanishida.com`（既定の `*.r2.dev` は使わない）。メディアはキーに `media/` prefix を持つため配信 URL は `…/media/<path>` 形式になる
- `NEXT_PUBLIC_SITE_URL` — サイトの公開 URL。`metadataBase`（OG/canonical の絶対 URL 生成）に使用（クライアントに露出。未設定時は本番ドメインにフォールバック）
- `AUTH_SECRET` — next-auth の署名鍵

## セキュリティ上の注意

- `.env` は **git 管理外**（[`../.gitignore`](../.gitignore)）。実値（Neon・R2・AUTH_SECRET）が入るため**読取・出力しない**。
- `NEXT_PUBLIC_` 接頭辞の変数はクライアントへ露出するので、秘密情報を入れないこと。
- 破壊的スクリプト（[`scripts/seed.ts`](../scripts/seed.ts) / [`scripts/storage.ts`](../scripts/storage.ts)）は**ローカル接続先**でのみ実行する（[development.md](./development.md)）。

## デプロイ（Cloudflare Workers / OpenNext）

### 環境とフロー

| 局面 | 実行 | DB（Hyperdrive） | Worker / URL |
| --- | --- | --- | --- |
| ローカル | `pnpm dev` | dev Neon（env 変数でエミュレート） | localhost |
| **PR → main** | [`deploy-preview.yaml`](../.github/workflows/deploy-preview.yaml) が `wrangler deploy --env staging` | dev Neon（`blog-neon-dev`） | `blog-akimasanishida-com-staging.<sub>.workers.dev`（非公開・PR にコメント） |
| **main マージ** | [`deploy-production.yaml`](../.github/workflows/deploy-production.yaml) が `wrangler deploy` | prod Neon（`blog-neon-prod`） | `blog.akimasanishida.com`（カスタムドメインは [`../wrangler.jsonc`](../wrangler.jsonc) の `routes.custom_domain` で宣言・デプロイ時に自動割り当て） |

- 環境定義は [`../wrangler.jsonc`](../wrangler.jsonc)（top-level=本番、`env.staging`=プレビュー。hyperdrive と secret は環境ごと）。
- 手動操作も可能: ローカル確認は `pnpm preview`、手動デプロイは `pnpm deploy`（いずれもビルド時に `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` が必要）。本番は GitHub Actions からも手動実行できる（[`deploy-production.yaml`](../.github/workflows/deploy-production.yaml) の `workflow_dispatch`。Actions タブ または `gh workflow run "Deploy (production)"`）。Variable/Secret 更新後に main を再 push せず再デプロイしたいときに使う。
- 型生成: `pnpm cf-typegen`（`wrangler.jsonc` から `cloudflare-env.d.ts` を再生成。**git 管理外**・`wrangler.jsonc` 変更後に実行）。
- 品質ゲートは [`check.yaml`](../.github/workflows/check.yaml)（`pnpm lint` ＋ `pnpm test`）。main をブランチ保護し、これを必須チェックにすることで壊れた本番デプロイを防ぐ。

### 初回セットアップ（ダッシュボード / 手元作業）

1. **Hyperdrive**（[`hyperdrive`](https://developers.cloudflare.com/hyperdrive/)）を 2 つ作成し ID を [`../wrangler.jsonc`](../wrangler.jsonc) に記入: 本番=prod Neon（top-level）/ staging=dev Neon（`env.staging`）。**クエリキャッシュは無効化する**（`--caching-disabled`）。有効（既定 `max_age` 60秒）だと一覧の SELECT がキャッシュされ、投稿/削除が一覧へ反映されるまで最大 ~60秒遅れる（[#55](https://github.com/akimasanishida/blog.akimasanishida.com/issues/55)）。コネクションプーリングは無効化後も維持される。この設定は Cloudflare リソース側に保持され `wrangler.jsonc` には出ないため、両環境で個別に設定・確認する:

   ```
   wrangler hyperdrive update <本番ID> --caching-disabled     # prod（blog-neon-prod）
   wrangler hyperdrive update <stagingID> --caching-disabled  # staging（blog-neon-dev）
   wrangler hyperdrive get <ID>   # caching.disabled: true を確認
   ```
2. **実行時シークレット**を環境ごとに設定（`wrangler secret put <NAME>` は本番、`--env staging` 付きは staging）: `AUTH_SECRET` / `STORAGE_BUCKET_NAME` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` / `STORAGE_ENDPOINT_URL`。
3. **GitHub Actions** の設定:
   - リポジトリ Secrets: `CLOUDFLARE_API_TOKEN`（Workers 編集権限）/ `CLOUDFLARE_ACCOUNT_ID`。
   - Environment `production` / `staging` それぞれに、Secret `HYPERDRIVE_LOCAL_CONNECTION_STRING`（各 Neon 接続文字列・末尾 `?sslmode=require`）と Variables `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_STORAGE_PUBLIC_URL`。
4. **カスタムドメイン（`blog.akimasanishida.com`）の割り当て**は [`../wrangler.jsonc`](../wrangler.jsonc) の
   top-level `routes`（`custom_domain: true`）で宣言し、本番デプロイ時に自動プロビジョニングされる
   （カスタムドメイン作成＋CF DNS レコード生成まで wrangler が実施）。前提として **ゾーン `akimasanishida.com`
   が Cloudflare にオンボード済み（active）** であること。Workers のカスタムドメインは対象ゾーンが CF の権威 DNS に
   あることを要求し、サブドメイン単独ゾーンは Enterprise 限定のため、**フルゾーン移管**（NS を Porkbun→Cloudflare）で行う。
   - 手順: ①Cloudflare に `akimasanishida.com` を Full setup で追加 → ②apex/www/MX/TXT/_dmarc など既存レコードを
     CF DNS に**再現**（apex・www は Vercel 向き、MX は Porkbun メール転送を維持。`blog` は再現不要＝Worker が作る）
     → ③Porkbun の NS を Cloudflare の 2 本に変更し active 化を待つ → ④ゾーン active 後に本番デプロイで `blog` が
     Worker へ接続。API トークンは新ゾーンの DNS 編集＋Workers Routes 編集権限が必要。
   - `blog` の解決不可窓を最小化するため、NS 変更は②の再現後に行い、active 直後に本番デプロイする。
5. **R2 カスタムドメイン（`cdn.blog.akimasanishida.com`）の接続**（[#65](https://github.com/akimasanishida/blog.akimasanishida.com/issues/65)）。本番バケットの公開閲覧を既定の `*.r2.dev` からカスタムドメインへ一本化する。前提はゾーン `akimasanishida.com` が Cloudflare active（上記 4 と同じ）。
   - 接続: `wrangler r2 bucket domain add <本番バケット名> --domain cdn.blog.akimasanishida.com --zone-id <akimasanishida.com のゾーンID>`（CF が CNAME を自動生成し証明書を発行）。ダッシュボードなら R2 → 対象バケット → Settings → Public access → Custom Domains から追加。
   - 公開 URL 切替: GitHub の `production` Variable `NEXT_PUBLIC_STORAGE_PUBLIC_URL` を `https://cdn.blog.akimasanishida.com` に更新（step 3）。`NEXT_PUBLIC_*` はビルド時インライン化のため、変更後の**本番デプロイ（main マージ）で反映**される。メディアはキーに `media/` prefix を持つので配信 URL は `https://cdn.blog.akimasanishida.com/media/<path>` になる。
   - 任意: カスタムドメイン動作確認後に `wrangler r2 bucket dev-url disable <本番バケット名>` で `r2.dev` 公開を無効化し、公開経路をカスタムドメインへ一本化する（本番 Worker の `workers_dev: false` と同じ方針）。

### 制約

- **ミドルウェア不可**: Next.js 16 の `proxy`（旧 middleware）は Node.js ランタイム固定で、OpenNext/Cloudflare が未対応。このためルート保護は middleware ではなく [`app/admin/layout.tsx`](../app/admin/layout.tsx) の `auth()` ガードで行う（[auth.md](./auth.md) / [decisions/0002](./decisions/0002-auth-admin-only.md)）。
- **bcrypt 不可**: ネイティブアドオンは Workers で動かないため `bcryptjs`（純 JS・ハッシュ互換）を使用。
