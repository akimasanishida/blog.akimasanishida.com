# 開発ガイド

> セットアップ手順の詳細は [`../README.md`](../README.md)、AI 向け規約は [`../CLAUDE.md`](../CLAUDE.md)。
> 本書はそれらと重複しない範囲で、開発フローとコマンドの「意図」を補う。

## コマンド

| コマンド | 用途 |
| --- | --- |
| `pnpm dev` | 開発サーバー |
| `pnpm build` | 本番ビルド |
| `pnpm lint` | ESLint（CI と同等。PR 前に必須） |
| `npx tsc --noEmit` | 型チェック（CI には無いので手元で実施推奨） |
| `pnpm test` | Vitest 単体テスト（CI 同等）。詳細は [testing.md](./testing.md) |
| `pnpm test:e2e` | Playwright E2E ⚠️ ローカル専用（dev サーバー＋seed 済み DB/R2 が前提） |
| `pnpm docs:build` | `docs/*.md` から人間向け HTML を `docs/_site/` に生成 |
| `pnpm db:seed` | DB 初期化＋モック投入 ⚠️ ローカル専用・要確認 |
| `pnpm storage:upload` | テスト画像アップロード ⚠️ ローカル専用・要確認 |

## ドキュメント運用（重要）

- **正本は Markdown**（`docs/`）。AI が読み PR で diff するため。人間向け HTML は `pnpm docs:build` で生成（`docs/_site/`、**git 管理外**）。
- 形式戦略の根拠（MD ingest / HTML output）は [decisions/](./decisions/README.md) を参照。
- **ルート/スキーマを変えたら**、[routing.md](./routing.md) の状態欄・[data-model.md](./data-model.md) のリンクを**同じ PR で更新**。
  - `app/**/page.tsx`・`types/*.ts`・`scripts/seed.ts` を編集すると、Claude Code の PostToolUse フック
    （`.claude/hooks/docs-reminder.sh`）が docs 更新を**自動リマインド**する（非ブロッキング）。
- ドキュメントに**事実の写しを増やさない**（事実は code が SoT、docs はリンク＋意図）。

### HTML プレビュー
`pnpm docs:build` 後、`docs/_site/index.html` をブラウザで開く（`file://` でも可）。

## ワークフロー（Human on the loop）

- ブランチ名（`main` で直接作業しない。説明・単語間は**スネークケース `_`**）:
  - Issue あり: `#<番号>_<説明>`（例: `#18_admin_media`）。
  - Issue 無し: `<種別>/<説明>`（例: `chore/create_pr_docs_check`、種別は feat/fix/docs/chore/refactor/revert 等）。
- 機能実装は plan mode で計画 → 承認 → 実装。
- PR 前に `pnpm lint`（必要なら `npx tsc --noEmit`）。PR は [`../.github/pull_request_template.md`](../.github/pull_request_template.md) に従う。
- **コードレビューは `/review`**（[`../.claude/agents/code-reviewer.md`](../.claude/agents/code-reviewer.md) の**コンテキストを持たないサブエージェント**が差分をレビューし `REVIEW_RESULT: PASS/BLOCK` を返す）。[`../.claude/skills/create-pr/SKILL.md`](../.claude/skills/create-pr/SKILL.md) が内部で自動実行し、重大（Critical/Major）指摘は PR 作成をブロックする。
- **PR 作成前に必ず docs の整合をチェックする**（[`../.claude/skills/create-pr/SKILL.md`](../.claude/skills/create-pr/SKILL.md) の手順）。不整合は PR 前に同ブランチで修正する。
- 破壊的スクリプト・push・PR 作成・依存変更は確認プロンプトが出る（[`../.claude/settings.json`](../.claude/settings.json) の `ask`）。

## 既知の負債
[roadmap.md](./roadmap.md) の「既知の負債」を参照（テスト未整備、next-auth beta、スキーマ SoT 等）。
