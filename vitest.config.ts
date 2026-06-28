import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// tsconfig の `@/*` → リポジトリルート を Vitest でも再現する。
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // 単体テストはロジック層のみ。E2E（e2e/*.spec.ts）は Playwright が担当。
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": root },
  },
});
