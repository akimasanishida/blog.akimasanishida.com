# ドキュメント

`blog.akimasanishida.com` のプロジェクトドキュメント索引。

> **方針**: ここは **Markdown が正本**。AI が毎セッション読み、PR で diff するため。
> スキーマ・ルート・関数シグネチャなどの **事実は code が source of truth**で、本ドキュメントは
> それらを**リンクで指し**、code で表せない **「なぜ（設計意図・根拠）」と「これから（ロードマップ）」** を持つ。
> 人間向けの閲覧用 HTML は `pnpm docs:build` で `docs/_site/` に生成する（[development.md](./development.md) 参照）。

## 目次

| ドキュメント | 内容 |
| --- | --- |
| [architecture.md](./architecture.md) | システム全体像。リクエスト/データフロー、レイヤ構成 |
| [routing.md](./routing.md) | サイトマップ（実装済み / 未実装の状態付き） |
| [data-model.md](./data-model.md) | posts / users スキーマ（code 参照）とインデックス設計の根拠 |
| [auth.md](./auth.md) | 認証フロー（next-auth v5・`/admin` 保護・bcryptjs） |
| [content-pipeline.md](./content-pipeline.md) | Markdown → HTML 変換（remark/rehype・KaTeX・Prism） |
| [infrastructure.md](./infrastructure.md) | Neon(Postgres)・R2(S3互換)・環境変数・デプロイ |
| [development.md](./development.md) | セットアップ・コマンド・開発ワークフロー |
| [testing.md](./testing.md) | テスト構成（Vitest 単体 / Playwright E2E）と実行手順 |
| [roadmap.md](./roadmap.md) | 未実装の構想と優先度 |
| [decisions/](./decisions/README.md) | 設計判断の記録（ADR） |

## 関連（リポジトリ直下）

- [`../README.md`](../README.md) — リポジトリ概要とセットアップ手順
- [`../CLAUDE.md`](../CLAUDE.md) — AI（Claude Code）向けのプロジェクト文脈・規約
