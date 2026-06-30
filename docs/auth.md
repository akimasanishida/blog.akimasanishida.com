# 認証

> 事実は code が source of truth: [`auth.ts`](../auth.ts) / [`auth.config.ts`](../auth.config.ts) / [`app/admin/layout.tsx`](../app/admin/layout.tsx)。

## 概要

- **next-auth v5（beta）** の Credentials プロバイダによるメール+パスワード認証。
- パスワードは **bcryptjs** でハッシュ照合（`bcrypt.compare`。Workers でネイティブ bcrypt が動かないため純 JS の bcryptjs を使用。ハッシュは互換）。
- 保護対象は **`/admin/*` のみ**。それ以外は公開（[decisions/0002](./decisions/0002-auth-admin-only.md)）。

## フロー

1. ユーザーが [`app/login/page.tsx`](../app/login/page.tsx) でフォーム送信。
2. Server Action [`authenticate()`](../lib/actions.ts)（`"use server"`）が `signIn("credentials", formData)` を呼ぶ。
3. [`auth.ts`](../auth.ts) の `authorize`:
   - 入力を **zod** で検証（`email` 形式・`password` 6 文字以上）。
   - `getUser(email)` で users を 1 件取得 → `bcryptjs.compare` で照合。一致すれば User を返す。
4. 失敗時は `authenticate()` が日本語エラーメッセージを返す（`CredentialsSignin` 等）。

## 認可（レイアウトガード）

- [`app/admin/layout.tsx`](../app/admin/layout.tsx) が `auth()` でセッションを確認し、未ログインなら `/login` へ `redirect()`。`/admin/*` 全体がこのレイアウト配下なので一括保護される。
- Server Actions（[`lib/post-actions.ts`](../lib/post-actions.ts)）でも `auth()` を確認し多層防御。
- ミドルウェア（Next.js 16 の `proxy.ts`）は使わない: OpenNext/Cloudflare が Node.js ランタイムの proxy を未サポートのため（[infrastructure.md](./infrastructure.md)）。`auth.config.ts` は `pages.signIn` の定義のみ。

## 注意・既知の負債

- next-auth は **v5 beta** に固定（破壊的変更に注意）。
- 認証関連の DB アクセスは [`auth.ts`](../auth.ts) 内に直書き（`getUser`）。テスト未整備。
- シードの初期管理者は `admin@example.com` / `password`（[`scripts/seed.ts`](../scripts/seed.ts)、開発用）。本番では必ず変更すること。
