import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // メディアアップロード用に Server Action の body 上限を引き上げる（既定 1MB）。
    // 大容量メディアの無制限な追加を防ぐため、一般的なサイズで頭打ちにする。
    serverActions: { bodySizeLimit: "25mb" },
    // /admin/* は proxy.ts（ミドルウェア）を通るため、proxy 層の body クローン上限
    // （既定 10MB）も引き上げないと、Server Action へ届く前に切り詰められて
    // "Unexpected end of form" になる。両方を揃える必要がある。
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
