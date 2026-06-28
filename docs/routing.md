# ルーティング / サイトマップ

> ルートの事実は `app/` が source of truth。実装を変えたら本表の**状態欄とリンクを同じ PR で更新**すること。

状態: ✅ 実装済み / ⚠️ 一部実装 / 🚧 未実装（予定）

| ページ | パス | 内容 | 状態 | 実装 |
| --- | --- | --- | --- | --- |
| トップ（記事一覧） | `/?page=<n>` | 最新記事一覧（新着順、`?page=` でページネーション。7 件/ページ） | ✅ | [`app/page.tsx`](../app/page.tsx) / [`components/Pagination.tsx`](../components/Pagination.tsx) |
| 記事ページ | `/posts/[slug]` | 個別記事 | ✅ | [`app/posts/[slug]/page.tsx`](../app/posts/%5Bslug%5D/page.tsx) |
| About | `/about` | 概要 | ✅ | [`app/about/page.tsx`](../app/about/page.tsx) |
| ログイン | `/login` | 管理者ログイン | ✅ | [`app/login/page.tsx`](../app/login/page.tsx) |
| 管理画面 | `/admin` | 記事一覧の閲覧（認証付き・ソート/ページネーション）。**新規作成・編集はモック（未永続化）** | ⚠️ | [`app/admin/page.tsx`](../app/admin/page.tsx) |
| メディア管理 | `/admin/media` | メディア一覧・アップロード・削除・リネーム（認証付き、R2 の `media/` を直接 List） | ✅ | [`app/admin/media/page.tsx`](../app/admin/media/page.tsx) / [`lib/storage.ts`](../lib/storage.ts) |
| 記事の新規作成 | `/admin/posts/new` | 記事エディタ（認証付き）。**UI モック（#9）。保存・公開は未永続化** | ⚠️ | [`app/admin/posts/new/page.tsx`](../app/admin/posts/new/page.tsx) / [`components/admin/PostEditor.tsx`](../components/admin/PostEditor.tsx) |
| 記事の編集 | `/admin/posts/[id]` | 記事エディタ（認証付き）。**UI モック（#9）。ダミー記事を事前入力** | ⚠️ | [`app/admin/posts/[id]/page.tsx`](../app/admin/posts/%5Bid%5D/page.tsx) |
| アーカイブ（年） | `/archives/[year]` | 指定年の記事 | 🚧 | — |
| アーカイブ（月） | `/archives/[year]/[month]` | 指定年月の記事 | 🚧 | — |
| カテゴリー | `/categories/[category]` | 指定カテゴリーの記事 | 🚧 | — |
| 検索結果 | `/search?q=...` | キーワード検索結果 | 🚧 | — |

> 注: 旧版にあった `/pages/[num]` 方式のページネーションは廃止し、トップページの `?page=`（searchParams）方式に変更済み。
> 経緯は [decisions/0001-pagination-searchparams.md](./decisions/0001-pagination-searchparams.md)。

> ⚠️ 記事エディタ（#9, `/admin/posts/new`・`/admin/posts/[id]`）は現状**UI モック**。
> カテゴリー候補・画像一覧はダミーデータで、保存・公開は永続化されない。
> 記事の DB 書き込み（#12, #1）は未実装（umbrella: #6）。
> 画像のストレージ書き込み（#18）は `/admin/media` で実装済み。詳細は [roadmap.md](./roadmap.md)。

未実装ルートの構想・優先度は [roadmap.md](./roadmap.md) を参照。
認証で保護されるルートは [auth.md](./auth.md) を参照。
