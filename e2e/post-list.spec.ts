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

// URL 未設定の下書きは、一覧の公開トグルからは公開できない（公開には URL 必須）。
test("URL 未設定の下書きは一覧の公開トグルで公開できない", async ({ page }) => {
  const title = `E2E公開拒否 ${Date.now()}`;

  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    d.accept();
  });

  // URL 未入力で下書きを作成
  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#content").fill("URL 無し公開拒否テスト");
  await page.getByRole("button", { name: "下書き保存" }).click();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();

  // 一覧で公開トグル → URL 必須エラーで公開されず、「下書き」のまま。
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "下書き", exact: true }).click();
  // 公開トグルは「確認ダイアログ → サーバーアクション → エラー alert」の順なので alert を待つ。
  await expect
    .poll(() => dialogs.some((m) => m.includes("公開するには URL が必要です")))
    .toBe(true);
  // 公開されず「下書き」のまま。
  await expect(row.getByRole("button", { name: "下書き", exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "公開", exact: true })).toHaveCount(0);

  // 後始末: 削除
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});
