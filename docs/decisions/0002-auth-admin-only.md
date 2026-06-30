# 0002: 認証保護は `/admin` のみ

**状態**: 採用

## 文脈
本サイトはブログ（公開コンテンツが大半）で、認証が必要なのは投稿・編集を行う管理機能のみ。

## 決定
**`/admin/*` 配下のみ**を保護し、未ログインは `/login` へリダイレクト。それ以外のルートは全て公開とする。
保護は [`app/admin/layout.tsx`](../../app/admin/layout.tsx) の `auth()` ガードで行う（`/admin/*` 全体がこのレイアウト配下）。

> 当初はミドルウェア（`proxy.ts` + `auth.config.ts` の `authorized` コールバック）で実装していたが、
> Cloudflare 移行に伴い廃止。Next.js 16 の `proxy`（旧 middleware）は Node.js ランタイム固定で
> OpenNext/Cloudflare が未対応のため、ルート保護をレイアウトへ移した（[infrastructure.md](../infrastructure.md)）。

## 結果
- 公開ページは認可処理を通らず軽量。保護対象が明確。
- Server Actions（[`lib/post-actions.ts`](../../lib/post-actions.ts)）でも `auth()` で多層防御。
- 将来 admin 以外に保護領域が必要になったら、対象セグメントのレイアウトに同様のガードを足す。詳細は [auth.md](../auth.md)。
