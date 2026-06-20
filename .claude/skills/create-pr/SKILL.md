---
name: create-pr
description: PR（プルリクエスト）を作成するときの手順と本文の規約。ユーザーが PR 作成・プルリクを依頼したときに使う。
when_to_use: PR を作る / プルリクエストを出す / gh pr create するとき
---

PR を作成するときは次に従う。

1. まず `/pre-pr`（`pnpm lint` ＋ `npx tsc --noEmit`）を通す。失敗したら PR 作成に進まない。
2. ブランチは Issue 単位（`main` で直接作業しない）。本文は
   [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)（概要 / コード / テスト）に従う。
3. 対応する Issue があれば、本文冒頭に `close #<Issue番号>`（GitHub の closing keyword）を入れる。
   これで `main` へのマージ時に対象 Issue が自動クローズされる。Issue を伴わない PR では省略してよい。
4. `gh pr create` で作成する（`.claude/settings.json` で自動許可済み）。
