# 0003: スキーマ SoT と マイグレーション移行

**状態**: 検討中（暫定: 既存 code を SoT、移行は別 Issue）

## 文脈
posts/users のスキーマが [`scripts/seed.ts`](../../scripts/seed.ts) の `CREATE TABLE`（DDL）と
[`types/posts.ts`](../../types/posts.ts) / [`types/users.ts`](../../types/users.ts)（TS 型）に二重で存在し、
source of truth が一元化されていない。AI 駆動開発では次が問題:

1. `CREATE TABLE IF NOT EXISTS` は既存 DB に効かない「沈黙の無動作」罠。スキーマ変更が適用されたと誤認しうる。
2. DDL と TS 型の二重表現に整合チェックが無く、ドリフトを検知できない。
3. 型⇄DB の自動同期が無い。

## 決定（暫定）
- 当面は **既存 code を SoT** とする: DDL の正本 = `scripts/seed.ts`、型の正本 = `types/*.ts`。
  ドキュメントはフィールド表を持たずここへリンクする（[data-model.md](../data-model.md)）。
- マイグレーション機構（drizzle 等）への移行は**別 Issue 化**して検討（型自動生成でドリフト根絶を狙う）。
  - Issue: #TBD（作成後に番号を記入）

## 結果
- ドキュメントの二重管理は解消。code 内の DDL/型ドリフトは未解決のまま残る（移行 Issue で対応）。
