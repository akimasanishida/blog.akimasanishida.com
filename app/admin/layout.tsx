import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// 管理画面は検索対象外（noindex）。各ページのタイトルは "X | 管理" に統一する。
export const metadata: Metadata = {
  title: { default: "管理", template: "%s | 管理" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // /admin/* の認証ガード。Next.js 16 の proxy（旧 middleware）は OpenNext/Cloudflare
  // が未対応のため、ルート保護はミドルウェアではなくこのレイアウトで行う
  // （Server Actions 側でも auth() で多層防御している）。
  const session = await auth();
  if (!session?.user) redirect("/login");

  return children;
}
