# blog.akimasanishida.com

[私のブログ](https://blog.akimasanishida.com) のレポジトリ（リニューアル準備中）です。

現行のレポジトリは [こちら](https://github.com/akimasanishida/blog)。

## 技術スタック

- Next.js App Router (React, TypeScript)
- PostgreSQL（本プロジェクトでは [Neon](https://neon.com/) を使用）
- S3（互換）ストレージ（本プロジェクトでは [Cloudflare R2](https://developers.cloudflare.com/r2/) を使用）

## セットアップ

### PostgreSQL

1. PostgreSQL をセットアップ
2. `.env.example` をコピーして `.env` を作成し、PostgreSQL の接続情報を設定
3. `pnpm db:seed` を実行して、データベースのセットアップとモックデータを投入

### ストレージ

1. ストレージをセットアップし、バケットとアクセスキーを作成
2. **`.env` がまだない場合は**、`.env.example` をコピーして `.env` を作成
3. `.env` にストレージの接続情報を設定
4. `pnpm storage:upload` を実行して、テスト画像をストレージにアップロード
