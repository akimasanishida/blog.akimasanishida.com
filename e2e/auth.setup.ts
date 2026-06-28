import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, "../playwright/.auth/admin.json");

// seed のシードユーザーでログインし、storageState を保存する。
setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill("password");
  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: "記事一覧" })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
