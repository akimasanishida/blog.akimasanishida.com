# 認証

> 事実は code が source of truth: [`auth.ts`](../auth.ts) / [`auth.config.ts`](../auth.config.ts) / [`proxy.ts`](../proxy.ts)。

## 概要

- **next-auth v5（beta）** の Credentials プロバイダによるメール+パスワード認証。
- パスワードは **bcrypt** でハッシュ照合（`bcrypt.compare`）。
- 保護対象は **`/admin/*` のみ**。それ以外は公開（[decisions/0002](./decisions/0002-auth-admin-only.md)）。

## フロー

1. ユーザーが [`app/login/page.tsx`](../app/login/page.tsx) でフォーム送信。
2. Server Action [`authenticate()`](../lib/actions.ts)（`"use server"`）が `signIn("credentials", formData)` を呼ぶ。
3. [`auth.ts`](../auth.ts) の `authorize`:
   - 入力を **zod** で検証（`email` 形式・`password` 6 文字以上）。
   - `getUser(email)` で users を 1 件取得 → `bcrypt.compare` で照合。一致すれば User を返す。
4. 失敗時は `authenticate()` が日本語エラーメッセージを返す（`CredentialsSignin` 等）。

## 認可（ミドルウェア）

- [`proxy.ts`](../proxy.ts) が `NextAuth(authConfig).auth` をエクスポートし、`matcher` で API・静的アセットを除く全ルートに適用。
- [`auth.config.ts`](../auth.config.ts) の `authorized` コールバック: `/admin` 配下は未ログインなら拒否（→ `pages.signIn = "/login"` へリダイレクト）。それ以外は許可。

## 注意・既知の負債

- next-auth は **v5 beta** に固定（破壊的変更に注意）。
- 認証関連の DB アクセスは [`auth.ts`](../auth.ts) 内に直書き（`getUser`）。テスト未整備。
- シードの初期管理者は `admin@example.com` / `password`（[`scripts/seed.ts`](../scripts/seed.ts)、開発用）。本番では必ず変更すること。
