import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "ログイン",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
