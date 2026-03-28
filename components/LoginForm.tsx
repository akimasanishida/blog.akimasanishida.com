"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFields = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginFields, string>>;

export default function LoginForm() {
  const [fields, setFields] = useState<LoginFields>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleChange =
    (name: keyof LoginFields) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFields((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {};

    if (!fields.email) {
      nextErrors.email = "メールアドレスを入力してください。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      nextErrors.email = "メールアドレスの形式が正しくありません。";
    }

    if (!fields.password) {
      nextErrors.password = "パスワードを入力してください。";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // 認証処理は後で実装する。
    console.log("Login form submitted", fields);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold tracking-tight">管理者ページログイン</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            メールアドレス
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-10 px-3"
            placeholder="you@example.com"
          />
          <p id="email-error" className="mt-1 min-h-5 text-sm text-red-600" aria-live="polite">
            {errors.email}
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            パスワード
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={fields.password}
            onChange={handleChange("password")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-10 px-3"
            placeholder="********"
          />
          <p
            id="password-error"
            className="mt-1 min-h-5 text-sm text-red-600"
            aria-live="polite"
          >
            {errors.password}
          </p>
        </div>

        <Button type="submit" className="mt-2 w-full" size="lg">
          ログイン
        </Button>
      </form>
    </div>
  );
}