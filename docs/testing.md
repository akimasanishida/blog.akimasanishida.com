# テスト

テストは 2 層。**事実（実装）は code が SoT**。本書は構成と実行手順の「なぜ・どう動かすか」を持つ。

| 種別 | ツール | 対象 | CI | 実体 |
| --- | --- | --- | --- | --- |
| 単体 | **Vitest** | ロジック層（DB/ブラウザ不要） | ✅ `pnpm test` | [`vitest.config.ts`](../vitest.config.ts) / `lib/**/*.test.ts` |
| E2E | **Playwright** | 管理画面の UI フロー（実 DB/R2） | ❌ ローカル専用 | [`playwright.config.ts`](../playwright.config.ts) / [`e2e/`](../e2e/) |

## 責務分担（なぜこの線引きか）

- **Vitest = 純粋ロジック**: `renderMarkdownToHTML`（画像/動画/音声の振り分け・URL 書き換え・figcaption）と
  [`lib/post-format.ts`](../lib/post-format.ts) の slug 書式・公開日整形・スニペット生成・表示名。
  DB/認証/ブラウザに触れないので高速かつ CI で常時実行できる。
- **Playwright = 実フロー**: ログイン→新規作成→メディア挿入→プレビュー→保存、既存更新、一覧の公開切替・削除。
  認証付きの Server Action（`savePost` 等）と DB/R2 を伴う挙動はここで担保する。

## 単体テスト（Vitest）

```sh
pnpm test         # 1 回実行（CI と同等）
pnpm test:watch   # 監視モード
```

`@/*` エイリアスは `vitest.config.ts` で解決。`vitest.setup.ts` が
`NEXT_PUBLIC_STORAGE_PUBLIC_URL` を固定値にして出力を検証可能にする。

## E2E（Playwright・ローカル専用）

DB/R2 を伴うため CI には載せない。前提:

1. `DATABASE_URL` が**ローカル**を指すことを確認のうえ `pnpm db:seed`（admin@example.com / password を作成）。
2. 初回のみブラウザ取得: `pnpm exec playwright install chromium`。

```sh
pnpm test:e2e      # ヘッドレス実行（webServer が pnpm dev を自動起動）
pnpm test:e2e:ui   # UI モードで個別確認
```

- ログインは `e2e/auth.setup.ts` が一度だけ行い、`playwright/.auth/admin.json`（git 管理外）に保存して使い回す。
- 各テストは slug を `e2e-${Date.now()}` で一意化し、作成した記事は一覧から削除して後始末する。
- メディア挿入テストはローカル R2 に画像が無ければ [`scripts/smile.png`](../scripts/smile.png) をアップロードして使う。

> ⚠️ E2E は実 DB/R2 に書き込む。`DATABASE_URL` が**本番（Neon）を指していないこと**を必ず確認すること。
