# 設計判断の記録（ADR）

主要な設計判断を軽量な ADR（Architecture Decision Record）として残す。
「なぜそうしたか」を後から辿れるようにするのが目的。code に書けない**理由**を記録する場所。

## 書式

各 ADR は連番ファイル `NNNN-kebab-title.md`。最小構成:

- **状態**: 採用 / 廃止 / 置換（後継 ADR へリンク）
- **文脈**: なぜ判断が必要だったか
- **決定**: 何を選んだか
- **結果**: トレードオフ・影響

## 一覧

| # | タイトル | 状態 |
| --- | --- | --- |
| [0001](./0001-pagination-searchparams.md) | ページネーションを searchParams 方式に | 採用 |
| [0002](./0002-auth-admin-only.md) | 認証保護は `/admin` のみ | 採用 |
| [0003](./0003-schema-sot-and-migration.md) | スキーマ SoT と マイグレーション移行 | 検討中 |
