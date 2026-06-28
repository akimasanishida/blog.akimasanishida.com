import { defineConfig, devices } from "@playwright/test";

// E2E はローカル dev 環境（ローカル DB / R2）に対して実行する。
// 前提: `pnpm db:seed` 済み（admin@example.com / password が存在）。
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // ローカル DB を共有するため直列実行（データ競合を避ける）。
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // 先にログインして storageState を保存し、各テストで使い回す。
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
