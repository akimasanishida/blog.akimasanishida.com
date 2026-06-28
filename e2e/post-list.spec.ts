import { test, expect } from "@playwright/test";

// 一覧の公開/下書きトグルと削除。下書きを作ってから操作する。
test("一覧で公開/下書きを切り替え、削除できる", async ({ page }) => {
  const slug = `e2e-list-${Date.now()}`;
  const title = `E2E一覧 ${slug}`;

  // 下書きを作成
  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("一覧テスト本文");
  await page.getByRole("button", { name: "下書き保存" }).click();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();

  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible();

  // 確認ダイアログ（トグル・削除）は自動承認
  page.on("dialog", (d) => d.accept());

  // 下書き → 公開
  await row.getByRole("button", { name: "下書き", exact: true }).click();
  await expect(row.getByRole("button", { name: "公開", exact: true })).toBeVisible();

  // 削除
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});
