import { test, expect } from "@playwright/test";

// 新規作成 → 公開 → 公開ページ表示 → 後始末（削除）。
test("新規作成して公開し、公開ページに表示される", async ({ page }) => {
  const slug = `e2e-${Date.now()}`;
  const title = `E2E記事 ${slug}`;

  // 公開時の確認・削除時の確認ダイアログを自動承認
  page.on("dialog", (d) => d.accept());

  await page.goto("/admin");
  await page.getByRole("link", { name: "新規作成", exact: true }).click();
  await page.waitForURL("**/admin/posts/new");

  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("# 見出し\n\n本文テストです。");

  // 公開（新規作成成功で投稿完了ページへリダイレクトされる）
  await page.getByRole("button", { name: "公開", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "投稿が完了しました" }),
  ).toBeVisible();

  // 一覧に出現
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // 公開ページに表示
  await page.goto(`/posts/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("本文テストです。")).toBeVisible();

  // 後始末: 一覧から削除（確認ダイアログは冒頭で自動承認登録済み）
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});

// 下書きは URL（slug）未入力でも保存できる（公開時のみ URL 必須）。
test("URL 未入力でも下書き保存できる", async ({ page }) => {
  const title = `E2E下書きURLなし ${Date.now()}`;

  page.on("dialog", (d) => d.accept()); // 削除確認を自動承認

  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#content").fill("URL なし下書き本文");

  // URL 未入力のまま下書き保存 → エラーにならず編集ページへ遷移する。
  await page.getByRole("button", { name: "下書き保存" }).click();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();
  await expect(page.getByText("URLを入力してください。")).toHaveCount(0);

  // 後始末: 一覧から削除
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});
