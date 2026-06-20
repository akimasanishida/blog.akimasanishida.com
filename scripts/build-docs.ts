/**
 * docs/*.md（正本）から人間向けの HTML を docs/_site/ に生成する。
 *
 * - 本文変換は lib/markdown.ts の renderMarkdownToHTML() を再利用。
 * - docs 間リンク（*.md）は *.html に書換え。
 * - docs の外（リポジトリの code 等）を指すリンクは、_site が 1 階層深いぶん "../" を 1 つ補う。
 * - 各ページに最小の HTML シェル + サイドナビ + CSS を付与する。
 *
 * 実行: pnpm docs:build （env 不要）
 */
import { promises as fs } from "fs";
import path from "path";
import { renderMarkdownToHTML } from "../lib/markdown";

const DOCS_DIR = path.join(process.cwd(), "docs");
const OUT_DIR = path.join(DOCS_DIR, "_site");

type DocPage = {
  /** docs/ からの相対パス（例: "README.md", "decisions/0001-....md"） */
  rel: string;
  /** 出力 html の docs/_site/ からの相対パス（例: "README.html"） */
  outRel: string;
  title: string;
};

async function findMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "_site") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdown(full)));
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** docs 内のリンクは .md→.html、docs 外のリンクは "../" を 1 つ補う。 */
function rewriteLinks(html: string, relDir: string): string {
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    if (/^(https?:|mailto:|#|\/)/.test(href)) return whole;
    const [pathPart, hash] = href.split("#");
    const resolved = path.posix.normalize(path.posix.join(relDir, pathPart));
    const escapesDocs = resolved.startsWith("..");
    if (escapesDocs) {
      // _site が docs より 1 階層深いので "../" を 1 つ前置
      return `href="../${href}"`;
    }
    const newPath = pathPart.replace(/\.md$/, ".html");
    return `href="${newPath}${hash ? "#" + hash : ""}"`;
  });
}

const CSS = `
:root { color-scheme: light dark; }
body { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.7; }
nav.docs-nav { border: 1px solid #8884; border-radius: 8px; padding: .75rem 1rem; margin-bottom: 2rem; font-size: .9rem; }
nav.docs-nav strong { display:block; margin-bottom:.35rem; }
nav.docs-nav a { margin-right: .9rem; white-space: nowrap; }
h1,h2,h3 { line-height: 1.3; } h2 { margin-top: 2rem; border-bottom: 1px solid #8883; padding-bottom: .2rem; }
a { color: #2563eb; } a:hover { text-decoration: underline; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th,td { border: 1px solid #8884; padding: .4rem .6rem; text-align: left; }
code { background: #8882; padding: .1rem .3rem; border-radius: 4px; }
pre { background: #8882; padding: 1rem; border-radius: 8px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 3px solid #8886; margin: 1rem 0; padding: .2rem 1rem; color: #666; }
`;

function buildNav(pages: DocPage[], current: DocPage): string {
  const depth = current.outRel.split("/").length - 1;
  const prefix = "../".repeat(depth);
  const links = pages
    .map((p) => {
      const href = prefix + p.outRel;
      const active = p.outRel === current.outRel ? " style=\"font-weight:700\"" : "";
      return `<a href="${href}"${active}>${p.title}</a>`;
    })
    .join("");
  return `<nav class="docs-nav"><strong>ドキュメント</strong>${links}</nav>`;
}

function pageShell(title: string, nav: string, body: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — blog.akimasanishida.com docs</title>
<style>${CSS}</style>
</head>
<body>
${nav}
<main>
${body}
</main>
</body>
</html>
`;
}

async function main() {
  const mdFiles = await findMarkdown(DOCS_DIR);
  if (mdFiles.length === 0) {
    console.error("docs/ に Markdown が見つかりません。");
    process.exit(1);
  }

  // ページ一覧（README をトップに）
  const pages: DocPage[] = [];
  for (const file of mdFiles) {
    const rel = path.relative(DOCS_DIR, file).split(path.sep).join("/");
    const outRel = rel.replace(/\.md$/, ".html");
    const md = await fs.readFile(file, "utf8");
    pages.push({ rel, outRel, title: extractTitle(md, rel) });
  }
  pages.sort((a, b) => {
    if (a.rel === "README.md") return -1;
    if (b.rel === "README.md") return 1;
    return a.rel.localeCompare(b.rel);
  });

  await fs.rm(OUT_DIR, { recursive: true, force: true });

  for (const page of pages) {
    const md = await fs.readFile(path.join(DOCS_DIR, page.rel), "utf8");
    const relDir = path.posix.dirname(page.rel) === "." ? "" : path.posix.dirname(page.rel);
    const bodyRaw = await renderMarkdownToHTML(md);
    const body = rewriteLinks(bodyRaw, relDir);
    const nav = buildNav(pages, page);
    const out = pageShell(page.title, nav, body);

    const outPath = path.join(OUT_DIR, page.outRel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, out, "utf8");

    // ルート README は index.html としても出力（入口）
    if (page.rel === "README.md") {
      await fs.writeFile(path.join(OUT_DIR, "index.html"), out, "utf8");
    }
  }

  console.log(`✅ ${pages.length} ページを ${path.relative(process.cwd(), OUT_DIR)}/ に生成しました。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
