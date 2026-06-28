# ルーティング / サイトマップ

> ルートの事実は `app/` が source of truth。実装を変えたら本表の**状態欄とリンクを同じ PR で更新**すること。

状態: ✅ 実装済み / ⚠️ 一部実装 / 🚧 未実装（予定）

| ページ | パス | 内容 | 状態 | 実装 |
| --- | --- | --- | --- | --- |
| トップ（記事一覧） | `/?page=<n>` | 最新記事一覧（新着順、`?page=` でページネーション。7 件/ページ） | ✅ | [`app/page.tsx`](../app/page.tsx) / [`components/Pagination.tsx`](../components/Pagination.tsx) |
| 記事ページ | `/posts/[slug]` | 個別記事 | ✅ | [`app/posts/[slug]/page.tsx`](../app/posts/%5Bslug%5D/page.tsx) |
| About | `/about` | 概要 | ✅ | [`app/about/page.tsx`](../app/about/page.tsx) |
| ログイン | `/login` | 管理者ログイン | ✅ | [`app/login/page.tsx`](../app/login/page.tsx) |
| 管理画面 | `/admin` | 記事一覧の閲覧（認証付き・ソート/ページネーション）。**投稿・編集は未実装** | ⚠️ | [`app/admin/page.tsx`](../app/admin/page.tsx) |
| メディア管理 | `/admin/media` | メディア一覧・アップロード・削除（認証付き、R2 を直接 List） | ✅ | [`app/admin/media/page.tsx`](../app/admin/media/page.tsx) / [`lib/storage.ts`](../lib/storage.ts) |
| アーカイブ（年） | `/archives/[year]` | 指定年の記事 | 🚧 | — |
| アーカイブ（月） | `/archives/[year]/[month]` | 指定年月の記事 | 🚧 | — |
| カテゴリー | `/categories/[category]` | 指定カテゴリーの記事 | 🚧 | — |
| 検索結果 | `/search?q=...` | キーワード検索結果 | 🚧 | — |

> 注: 旧版にあった `/pages/[num]` 方式のページネーションは廃止し、トップページの `?page=`（searchParams）方式に変更済み。
> 経緯は [decisions/0001-pagination-searchparams.md](./decisions/0001-pagination-searchparams.md)。

> ⚠️ `/admin` 本体は現状**記事一覧の閲覧のみ**。投稿・編集（#9）・画像管理（#10）・記事の DB 書き込み（#12, #1）は
> 未実装（umbrella: #6）。画像のストレージ書き込み（#18）は `/admin/media` で実装済み。詳細は [roadmap.md](./roadmap.md)。

未実装ルートの構想・優先度は [roadmap.md](./roadmap.md) を参照。
認証で保護されるルートは [auth.md](./auth.md) を参照。
