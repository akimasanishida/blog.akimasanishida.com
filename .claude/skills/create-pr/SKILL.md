---
name: create-pr
description: PR（プルリクエスト）を作成するときの手順と本文の規約。ユーザーが PR 作成・プルリクを依頼したときに使う。
when_to_use: PR を作る / プルリクエストを出す / gh pr create するとき
---

PR を作成するときは次に従う。

1. まず `/pre-pr`（`pnpm lint` ＋ `npx tsc --noEmit`）を通す。失敗したら PR 作成に進まない。
2. **`/review` を実行してコードレビューする**（コンテキストを持たない `code-reviewer` サブエージェント）。
   - 判定が `REVIEW_RESULT: BLOCK`（Critical/Major 相当）なら **PR 作成に進まない**。指摘と修正方針を提示し、
     同ブランチで修正コミットするか、ユーザーが明示的に「このまま進めて」と許可した場合のみ続行する。
   - `REVIEW_RESULT: PASS` なら次へ進む。
3. **PR 作成前にドキュメントの整合を必ず確認する**（不整合があれば PR 作成前に同ブランチで修正コミット）:
   - ルート/スキーマを変えたら [`docs/routing.md`](../../../docs/routing.md)（状態欄・リンク）と
     [`docs/data-model.md`](../../../docs/data-model.md) を同 PR で更新（CLAUDE.md の規約）。
   - 機能・ロードマップ項目を実装したら [`docs/roadmap.md`](../../../docs/roadmap.md) の該当行を更新し routing.md へ昇格。
   - 変更が他 docs（`architecture.md` / `infrastructure.md` / `auth.md` / `content-pipeline.md` 等）の
     記述に波及していないか `grep -rn <キーワード> docs --include=*.md` で確認。
   - docs は **Markdown が正本**。`docs/_site/` は生成物・**git 管理外**なので再生成・コミットは不要。
4. ブランチ名は規約に従う（`main` で直接作業しない。説明・単語間は**スネークケース `_`**）:
   - Issue あり: `#<番号>_<説明>`（例: `#18_admin_media` / `#39_fix_hydration_nesting`）。
   - Issue 無し: `<種別>/<説明>`（例: `chore/create_pr_docs_check` / `docs/readme_fixup` / `revert/pr_37`）。
     種別は Conventional Commits 系（feat / fix / docs / chore / refactor / revert 等）。

   本文は [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)（概要 / コード / テスト）に従う。
5. 対応する Issue があれば、本文冒頭に `close #<Issue番号>`（GitHub の closing keyword）を入れる。
   これで `main` へのマージ時に対象 Issue が自動クローズされる。Issue を伴わない PR では省略してよい。
6. `gh pr create` で作成する（`.claude/settings.json` で自動許可済み）。
