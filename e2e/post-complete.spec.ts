import { test, expect } from "@playwright/test";

// issue #54: 記事投稿後は完了ページへ遷移し、「記事を見る」「管理画面トップに戻る」導線を出す。
// また、完了ページから戻っても新規作成フォームに投稿内容が残らない（stale 復元しない）。

// 一覧から記事を削除する後始末（削除確認ダイアログは呼び出し側で accept 登録済み）。
async function cleanup(page: import("@playwright/test").Page, title: string) {
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
}

test("新規公開後の完了ページに導線が出て、記事を見るで公開ページへ遷移する", async ({
  page,
}) => {
  const slug = `e2e-complete-${Date.now()}`;
  const title = `E2E完了 ${slug}`;

  page.on("dialog", (d) => d.accept()); // 公開確認・削除確認を自動承認

  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("完了ページテスト本文");

  await page.getByRole("button", { name: "公開", exact: true }).click();

  // 完了ページ表示 + 2 つの導線
  await page.waitForURL("**/admin/posts/*/complete");
  await expect(
    page.getByRole("heading", { name: "投稿が完了しました" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "管理画面トップに戻る" }),
  ).toHaveAttribute("href", "/admin");

  // 「記事を見る」→ 公開ページ（/posts/[slug]）へ
  const viewLink = page.getByRole("link", { name: "記事を見る" });
  await expect(viewLink).toHaveAttribute("href", `/posts/${slug}`);
  await viewLink.click();
  await page.waitForURL(`**/posts/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await cleanup(page, title);
});

test("完了ページから戻っても新規作成フォームに投稿内容が残らない", async ({
  page,
}) => {
  const slug = `e2e-back-${Date.now()}`;
  const title = `E2E戻る ${slug}`;

  page.on("dialog", (d) => d.accept());

  // /admin → 新規作成 の順に遷移してから公開する（履歴を実運用に近づける）。
  await page.goto("/admin");
  await page.getByRole("link", { name: "新規作成", exact: true }).click();
  await page.waitForURL("**/admin/posts/new");

  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("戻るテスト本文");

  await page.getByRole("button", { name: "公開", exact: true }).click();
  await page.waitForURL("**/admin/posts/*/complete");

  // 新規公開は replace 遷移なので、戻ると新規フォームではなく /admin に戻る。
  await page.goBack();
  await expect(page).toHaveURL(/\/admin(\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "記事を新規作成" }),
  ).toHaveCount(0);

  await cleanup(page, title);
});

test("既存記事の更新後も完了ページへ遷移し、戻ると編集ページに戻れる", async ({
  page,
}) => {
  const slug = `e2e-update-${Date.now()}`;
  const title = `E2E更新 ${slug}`;

  page.on("dialog", (d) => d.accept()); // 公開・更新・削除の確認を自動承認

  // まず新規公開して記事を作り、完了ページの URL から id を取り出す。
  await page.goto("/admin/posts/new");
  await page.getByLabel("タイトル").fill(title);
  await page.locator("#slug").fill(slug);
  await page.locator("#content").fill("更新前の本文");
  await page.getByRole("button", { name: "公開", exact: true }).click();
  await page.waitForURL("**/admin/posts/*/complete");
  const id = page.url().match(/\/admin\/posts\/([^/]+)\/complete/)?.[1];
  expect(id).toBeTruthy();

  // 編集ページを開いて本文を変更 → 「更新」
  await page.goto(`/admin/posts/${id}`);
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();
  await page.locator("#content").fill("更新後の本文");
  await page.getByRole("button", { name: "更新", exact: true }).click();

  // 既存更新も完了ページへ（push 遷移・?updated=1 で「更新しました」表示）
  await page.waitForURL("**/admin/posts/*/complete?updated=1");
  await expect(
    page.getByRole("heading", { name: "投稿が完了しました" }),
  ).toBeVisible();
  await expect(page.getByText(`「${title}」を更新しました。`)).toBeVisible();

  // push 遷移なので戻ると編集ページに戻れる
  await page.goBack();
  await expect(page.getByRole("heading", { name: "記事を編集" })).toBeVisible();

  await cleanup(page, title);
});
