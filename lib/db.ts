import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type Sql = ReturnType<typeof postgres>;

let sql: Sql | undefined;

// DB 接続を遅延生成して使い回す（postgres クライアントは module 内で 1 度だけ）。
// Cloudflare Workers では Hyperdrive バインディング経由で接続する（接続プール＋クエリ
// キャッシュ）。Hyperdrive が無い文脈（`next build` の静的生成・vitest・素の Node で
// 動く scripts/*.ts）では DATABASE_URL に直接フォールバックする。
export function getSql(): Sql {
  if (sql) return sql;

  let connectionString = process.env.DATABASE_URL;
  let viaHyperdrive = false;
  try {
    const { env } = getCloudflareContext();
    // HYPERDRIVE バインディングの型は wrangler 生成の cloudflare-env.d.ts に入るが、
    // それは git 管理外で CI に存在しないため、ここでは生成型に依存せずローカル型で
    // 参照する（実行時の挙動は同じ）。
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString?: string } })
      .HYPERDRIVE;
    if (hyperdrive?.connectionString) {
      connectionString = hyperdrive.connectionString;
      viaHyperdrive = true;
    }
  } catch {
    // Cloudflare 実行コンテキスト外（build / test / script）。DATABASE_URL を使う。
  }

  if (!connectionString) {
    throw new Error(
      "No database connection string: set the HYPERDRIVE binding or DATABASE_URL.",
    );
  }

  sql = postgres(
    connectionString,
    viaHyperdrive
      ? // Hyperdrive 経由（Cloudflare 公式推奨設定）。TLS はコードで固定せず接続文字列の
        // sslmode に委ねる: 本番の Hyperdrive プロキシ接続は非 TLS（sslmode 無し）、
        // ローカルエミュレーションは Neon へ直結するため接続文字列に ?sslmode=require が必要。
        { max: 5, fetch_types: false, prepare: true }
      : // 直結（vitest・scripts 等の素の Node で DATABASE_URL を使う場合）は SSL 必須。
        { ssl: "require" },
  );
  return sql;
}
