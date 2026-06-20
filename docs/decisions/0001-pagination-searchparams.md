# 0001: ページネーションを searchParams 方式に

**状態**: 採用（旧 `/pages/[num]` 動的ルートを置換）

## 文脈
当初設計ではページネーションを `/pages/[num]` という動的ルートで実現する想定だった。
しかし検索やソートなど他のクエリ状態と URL 上で合成しづらく、トップページとの重複も生じる。

## 決定
トップページ [`app/page.tsx`](../../app/page.tsx) を維持し、ページ番号を **`?page=<n>` の searchParams** で扱う。
ページ送り UI は [`components/Pagination.tsx`](../../components/Pagination.tsx) の `PaginationForPages` が
`URLSearchParams` を組み立てて生成する。1 ページ 7 件。

## 結果
- 検索等のクエリと自然に合成できる。動的セグメントの追加が不要。
- 旧 `/pages/[num]` は廃止。[routing.md](../routing.md) のサイトマップに反映済み。
