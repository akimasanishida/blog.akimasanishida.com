# コンテンツパイプライン（Markdown → HTML）

> 実装は [`lib/markdown.ts`](../lib/markdown.ts) が source of truth。本書は構成と意図を述べる。

記事本文（`posts.content`）は Markdown で保存し、表示時に `renderMarkdownToHTML()` で HTML へ変換する。
変換結果は [`app/posts/[slug]/page.tsx`](../app/posts/%5Bslug%5D/page.tsx) で `dangerouslySetInnerHTML` で描画。

## パイプライン（unified）

順序に意味があるため、変更時は [`lib/markdown.ts`](../lib/markdown.ts) の `.use()` 順を確認すること。

1. `remark-parse` — Markdown をパース
2. `rehype-unwrap-images` — `<p>` から `<img>` を取り出す
3. `remark-gfm` — GitHub Flavored Markdown（表・打消し等）
4. `remark-math` — 数式記法（`$E=mc^2$`）
5. `remark-emoji` — 絵文字（`:tada:`）
6. `remark-rehype`（`allowDangerousHtml`）— HTML AST へ変換
7. `rehype-rewrite` — **画像 URL をストレージ公開 URL に書換え**（`NEXT_PUBLIC_STORAGE_PUBLIC_URL`）+ `<figure>/<figcaption>` 化
8. `rehype-raw` — Markdown 中の生 HTML を許可
9. `rehype-katex` — KaTeX で数式描画（CSS: `katex/dist/katex.min.css`）
10. `rehype-prism-plus` — コードのシンタックスハイライト（行番号付き、CSS: `prism-themes/.../prism-one-dark.css`）
11. `rehype-slug` + `rehype-autolink-headings` — 見出しに id と自己リンク（`.anchor`）
12. `rehype-stringify` — HTML 文字列化

## 関連

- 画像は S3 互換ストレージに置く（[infrastructure.md](./infrastructure.md)）。`src` は相対パスで保存し、変換時に公開 URL を前置。
- 数式・コードの CSS は記事ページで個別 import している点に注意。

> 補足: ドキュメントの HTML 生成（`pnpm docs:build`）もこの `renderMarkdownToHTML()` を再利用している。
> 詳細は [development.md](./development.md)。
