# CLAUDE.md

このファイルは Claude Code が毎セッション読むプロジェクト文脈です。簡潔さ優先。
プロジェクト全体のドキュメントは [`docs/`](./docs/README.md)（索引）、セットアップ手順は [`README.md`](./README.md) を参照。
スキーマ/ルートの**事実は code が source of truth**（型は `types/`、DB スキーマは `scripts/seed.ts`）。docs は事実を複製せずリンクで指す。

## プロジェクト概要

`blog.akimasanishida.com` の個人ブログ（リニューアル版）。

- **Next.js 16 App Router** (React 19 / TypeScript strict)
- **PostgreSQL**（本番は [Neon](https://neon.com/)）
- **S3 互換ストレージ**（本番は [Cloudflare R2](https://developers.cloudflare.com/r2/)）
- 認証は **next-auth v5（beta）**、パスワードは bcrypt

## ディレクトリ地図

| パス | 役割 |
| --- | --- |
| `app/` | App Router のページ・レイアウト。`admin/` は認証付き管理画面 |
| `components/` | React コンポーネント。`components/ui/` は **shadcn**（再利用優先） |
| `lib/data.ts` | PostgreSQL クエリ（`fetchPostBySlug` 等） |
| `lib/actions.ts` | Server Actions（`authenticate` 等） |
| `lib/markdown.ts` | unified/remark/rehype による Markdown→HTML |
| `lib/definitions.ts` | 日付フォーマット（**Asia/Tokyo**） |
| `lib/utils.ts` | Tailwind の `cn()` |
| `types/` | `Post` / `User` 型定義 |
| `scripts/` | `seed.ts`・`storage.ts`（**破壊的・ローカル専用**）・`build-docs.ts`（docs→HTML 生成） |
| `auth.ts` / `auth.config.ts` / `proxy.ts` | next-auth 設定とミドルウェア |
| `docs/` | プロジェクトドキュメント（**Markdown が正本**）。索引は `docs/README.md` |
| `docs/_site/` | `pnpm docs:build` で生成する人間向け HTML（**git 管理外**） |

## コマンド

| コマンド | 用途 |
| --- | --- |
| `pnpm dev` | 開発サーバー |
| `pnpm build` | 本番ビルド |
| `pnpm lint` | ESLint（**CI と同等。PR 前に必須**） |
| `npx tsc --noEmit` | 型チェック（CI には無いので手元で実施推奨） |
| `pnpm docs:build` | `docs/*.md` から HTML を `docs/_site/` に生成（人間向け閲覧用） |
| `pnpm db:seed` | DB 初期化＋モック投入 ⚠️ **ローカル専用・要確認** |
| `pnpm storage:upload` | テスト画像アップロード ⚠️ **ローカル専用・要確認** |

## コーディング規約

- **SQL**: `lib/data.ts` の `postgres` タグ付きテンプレートを使い、値は `${}` 補間で渡す（自動エスケープ）。**文字列連結で SQL を組まない**。
- **UI**: 新規コンポーネントは `components/ui/`（shadcn）の既存要素を再利用。スタイルは Tailwind v4。
- **import**: `@/*` パスエイリアスを使用。
- **ドキュメント**: ルート/スキーマを変えたら [`docs/routing.md`](./docs/routing.md) の状態欄・[`docs/data-model.md`](./docs/data-model.md) のリンクを同じ PR で更新。docs に事実（フィールド定義等）の写しを増やさない（事実は code が SoT）。docs は Markdown が正本（HTML は `pnpm docs:build` で生成）。
- 既存ファイルの命名・コメント密度・イディオムに合わせる。

## 安全ルール（重要）

- `.env` を **読まない・出力しない**（Neon・R2・AUTH_SECRET の本物が入っている）。
- `pnpm db:seed` / `pnpm storage:upload` を **本番接続先で実行しない**。実行前に `DATABASE_URL` がローカルを指すか必ず確認する。
- `git push --force` 等の**強制 push 禁止**。`git reset --hard origin/*` 禁止。
- 破壊的 SQL（`DROP` / `TRUNCATE` / `WHERE` 無し `DELETE`）を実行しない。
- 依存追加・削除（`pnpm add/remove`）は**事前に相談**。

## ワークフロー（Human on the loop）

- ブランチ名（`main` で直接作業しない。説明・単語間は**スネークケース `_`**）:
  - Issue あり: `#<番号>_<説明>`（例: `#18_admin_media`）。
  - Issue 無し: `<種別>/<説明>`（例: `chore/create_pr_docs_check`、種別は feat/fix/docs/chore/refactor/revert 等）。
- 機能実装は **plan mode** で計画 → 承認 → 実装。
- PR 前に `pnpm lint`（必要なら `npx tsc --noEmit`）を通す。
- PR は [`.github/pull_request_template.md`](./.github/pull_request_template.md)（概要 / コード / テスト）に従う。
- 破壊的スクリプト・push・PR 作成・依存変更は確認プロンプトが出る（`.claude/settings.json` の `ask`）。

## 既知の負債（別 Issue 候補）

- テストフレームワーク未導入。CI（`.github/workflows/check.yaml`）は `pnpm lint` のみで型チェック・テストが無い。
- next-auth が v5 **beta**。
- DB マイグレーション機構が無く、スキーマは `scripts/seed.ts` の `CREATE TABLE IF NOT EXISTS` に依存。スキーマ SoT のマイグレーション機構移行を別 Issue で検討中（作成後に番号を記入: #TBD）。
