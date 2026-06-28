import { test, expect } from "@playwright/test";

// 未保存の変更があるとき、ブラウザの戻るで確認が出て、OK すると離脱できる。
test("未保存のまま戻る→確認 OK で離脱できる", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "新規作成", exact: true }).click();
  await page.waitForURL("**/admin/posts/new");

  // 未保存の変更を作る
  await page.locator("#content").fill("未保存の変更テスト");

  // 戻る: 離脱確認を OK → /admin へ戻れる
  page.once("dialog", (d) => d.accept());
  await page.goBack();
  await expect(page).toHaveURL(/\/admin(\?.*)?$/);
});
