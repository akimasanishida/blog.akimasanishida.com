import { test, expect } from "@playwright/test";

// 新規作成 → 公開 → 公開ページ表示 → 後始末（削除）。
test("新規作成して公開し、公開ページに表示される", async ({ page }) => {
  const slug = `e2e-${Date.now()}`;
  const title = `E2E記事 ${slug}`;

  await page.goto("/admin");
  await page.getByRole("link", { name: "新規作成", exact: true }).click();
  await page.waitForURL("**/admin/posts/new");

  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("# 見出し\n\n本文テストです。");

  // 公開（新規作成成功で編集ページへリダイレクトされる）
  await page.getByRole("button", { name: "公開", exact: true }).click();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();

  // 一覧に出現
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // 公開ページに表示
  await page.goto(`/posts/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("本文テストです。")).toBeVisible();

  // 後始末: 一覧から削除（確認ダイアログは自動承認）
  page.on("dialog", (d) => d.accept());
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});
