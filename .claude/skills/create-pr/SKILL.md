---
name: create-pr
description: PR（プルリクエスト）を作成するときの手順と本文の規約。ユーザーが PR 作成・プルリクを依頼したときに使う。
when_to_use: PR を作る / プルリクエストを出す / gh pr create するとき
---

PR を作成するときは次に従う。

1. まず `/pre-pr`（`pnpm lint` ＋ `npx tsc --noEmit`）を通す。失敗したら PR 作成に進まない。
2. **PR 作成前にドキュメントの整合を必ず確認する**（不整合があれば PR 作成前に同ブランチで修正コミット）:
   - ルート/スキーマを変えたら [`docs/routing.md`](../../../docs/routing.md)（状態欄・リンク）と
     [`docs/data-model.md`](../../../docs/data-model.md) を同 PR で更新（CLAUDE.md の規約）。
   - 機能・ロードマップ項目を実装したら [`docs/roadmap.md`](../../../docs/roadmap.md) の該当行を更新し routing.md へ昇格。
   - 変更が他 docs（`architecture.md` / `infrastructure.md` / `auth.md` / `content-pipeline.md` 等）の
     記述に波及していないか `grep -rn <キーワード> docs --include=*.md` で確認。
   - docs は **Markdown が正本**。`docs/_site/` は生成物・**git 管理外**なので再生成・コミットは不要。
3. ブランチは Issue 単位（`main` で直接作業しない）。本文は
   [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)（概要 / コード / テスト）に従う。
4. 対応する Issue があれば、本文冒頭に `close #<Issue番号>`（GitHub の closing keyword）を入れる。
   これで `main` へのマージ時に対象 Issue が自動クローズされる。Issue を伴わない PR では省略してよい。
5. `gh pr create` で作成する（`.claude/settings.json` で自動許可済み）。
