import type { NextAuthConfig } from "next-auth";

// /admin/* のルート保護はミドルウェアではなく app/admin/layout.tsx の auth() ガードで
// 行う（Next.js 16 の proxy は OpenNext/Cloudflare 未対応のため）。ここでは
// signIn ページの場所のみ定義する。
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
} satisfies NextAuthConfig;
