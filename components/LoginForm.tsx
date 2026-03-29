"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        管理者ページログイン
      </h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            メールアドレス
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            className="h-10 px-3"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            パスワード
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            className="h-10 px-3"
            placeholder="********"
            required
          />
        </div>

        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button type="submit" className="mt-2 w-full" size="lg" aria-disabled={isPending} disabled={isPending}>
          ログイン
        </Button>
        <div className="mt-4 text-center" aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>
      </form>
    </div>
  );
}
