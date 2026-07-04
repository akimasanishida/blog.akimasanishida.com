import { test, expect } from "@playwright/test";

// 新規記事を保存すると編集ページへ redirect するが、これは意図した遷移なので
// 離脱警告（beforeunload / カスタム confirm）が出てはいけない（Issue #53）。
test("新規保存では離脱警告が出ずに編集ページへ遷移する", async ({ page }) => {
  const slug = `e2e-leave-${Date.now()}`;
  const title = `E2E離脱 ${slug}`;

  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("離脱警告テスト本文");

  // 保存に伴う遷移中に離脱系ダイアログが出たら記録（種別は問わず accept して先へ進める）。
  const leaveDialogs: string[] = [];
  page.on("dialog", (d) => {
    const msg = d.message();
    if (d.type() === "beforeunload" || msg.includes("このページを離れます")) {
      leaveDialogs.push(msg || d.type());
    }
    d.accept().catch(() => {});
  });

  // 下書き保存（新規は draft でも編集ページへ redirect する＝同じ遷移経路）。
  await page.getByRole("button", { name: "下書き保存" }).click();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();

  // 意図した保存遷移なので離脱警告は 1 度も出ないはず。
  expect(leaveDialogs).toEqual([]);

  // 後始末: 一覧から削除（削除確認は上の handler が accept 済み）。
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});

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
