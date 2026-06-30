import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type Sql = ReturnType<typeof postgres>;

function createClient(connectionString: string, viaHyperdrive: boolean): Sql {
  return postgres(
    connectionString,
    viaHyperdrive
      ? // Hyperdrive 経由（Cloudflare 公式推奨設定）。TLS はコードで固定せず接続文字列の
        // sslmode に委ねる: 本番の Hyperdrive プロキシ接続は非 TLS（sslmode 無し）、
        // ローカルエミュレーションは Neon へ直結するため接続文字列に ?sslmode=require が必要。
        { max: 5, fetch_types: false, prepare: true }
      : // 直結（vitest・scripts 等の素の Node で DATABASE_URL を使う場合）は SSL 必須。
        { ssl: "require" },
  );
}

function resolve(): { cs: string; viaHyperdrive: boolean; ctx?: object } {
  let ctx: object | undefined;
  let cs = process.env.DATABASE_URL;
  let viaHyperdrive = false;
  try {
    const c = getCloudflareContext();
    ctx = c;
    // HYPERDRIVE バインディングの型は wrangler 生成の cloudflare-env.d.ts に入るが、
    // それは git 管理外で CI に存在しないため、生成型に依存せずローカル型で参照する。
    const hyperdrive = (c.env as { HYPERDRIVE?: { connectionString?: string } })
      .HYPERDRIVE;
    if (hyperdrive?.connectionString) {
      cs = hyperdrive.connectionString;
      viaHyperdrive = true;
    }
  } catch {
    // Cloudflare 実行コンテキスト外（build / test / script）。DATABASE_URL を使う。
  }
  if (!cs) {
    throw new Error(
      "No database connection string: set the HYPERDRIVE binding or DATABASE_URL.",
    );
  }
  return { cs, viaHyperdrive, ctx };
}

// Workers では I/O（DB ソケット）をリクエストをまたいで再利用できない（別リクエストの
// I/O を使うと例外＝ Error 1101）。そのため Cloudflare 実行時は **リクエスト単位**
// （getCloudflareContext が返す request スコープのオブジェクト）でクライアントを生成・
// 共有する。それ以外（単一プロセスの build / test / script）は module で 1 つ使い回す。
const perRequest = new WeakMap<object, Sql>();
let processWide: Sql | undefined;

export function getSql(): Sql {
  const { cs, viaHyperdrive, ctx } = resolve();
  if (ctx) {
    let sql = perRequest.get(ctx);
    if (!sql) {
      sql = createClient(cs, viaHyperdrive);
      perRequest.set(ctx, sql);
    }
    return sql;
  }
  if (!processWide) processWide = createClient(cs, viaHyperdrive);
  return processWide;
}
