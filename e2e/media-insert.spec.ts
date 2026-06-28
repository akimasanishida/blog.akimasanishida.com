import { test, expect } from "@playwright/test";
import path from "node:path";

// メディアピッカーで選択 → 貼り付け → 本文に相対キー記法が入り、プレビューで描画される。
test("メディアを挿入して本文に記法が入り、プレビューに表示される", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");

  await page.getByRole("button", { name: "メディアを挿入" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // メディアが無ければテスト画像をアップロード（R2 はローカル）。
  const selectButtons = dialog.getByRole("button", { name: /^選択/ });
  if ((await selectButtons.count()) === 0) {
    await dialog
      .locator('input[type="file"]')
      .setInputFiles(path.join(__dirname, "../scripts/smile.png"));
    await expect(selectButtons.first()).toBeVisible({ timeout: 20_000 });
  }

  await selectButtons.first().click();
  await dialog.getByRole("button", { name: "貼り付け" }).click();

  // 本文に `![..](media/..)` が挿入される
  await expect(page.locator("#content")).toHaveValue(/!\[.*\]\(media\//);

  // プレビュータブで画像/動画/音声のいずれかが描画される
  await page.getByRole("tab", { name: "プレビュー" }).click();
  await expect(
    page.locator(".article-preview :is(img, video, audio)").first(),
  ).toBeVisible();
});
