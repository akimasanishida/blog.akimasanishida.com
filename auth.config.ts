import type { NextAuthConfig } from "next-auth";

// /admin/* のルート保護はミドルウェアではなく app/admin/layout.tsx の auth() ガードで
// 行う（Next.js 16 の proxy は OpenNext/Cloudflare 未対応のため）。ここでは
// signIn ページの場所のみ定義する。
export const authConfig = {
  // Vercel 以外（Cloudflare Workers）では Auth.js がホストを自動信頼しないため明示する。
  // 未設定だと callback でホスト不信のエラー（"server configuration" 系）になる。
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
} satisfies NextAuthConfig;
