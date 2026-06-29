import type { Metadata } from "next";

// 管理画面は検索対象外（noindex）。各ページのタイトルは "X | 管理" に統一する。
export const metadata: Metadata = {
  title: { default: "管理", template: "%s | 管理" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
