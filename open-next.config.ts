import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 最小構成。ISR/データキャッシュの最適化（R2 incremental cache 等）は将来追加可能。
export default defineCloudflareConfig();
