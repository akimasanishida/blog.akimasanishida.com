import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";

export async function renderMarkdownToHTML(markdownContent: string): Promise<string> {
  const processor = unified()
    .use(remarkParse) // Parse Markdown
    .use(remarkGfm) // GitHub Flavored Markdown
    .use(remarkMath) // Math syntax (e.g., $E=mc^2$)
    .use(remarkEmoji) // Emoji (e.g., :tada:)
    .use(remarkRehype, { allowDangerousHtml: true }) // Convert to Rehype (HTML AST)
    .use(rehypeRaw) // Allow raw HTML in Markdown
    .use(rehypeKatex) // Render math with KaTeX
    .use(rehypePrismPlus, { ignoreMissing: true, showLineNumbers: true }) // Code syntax highlighting
    .use(rehypeSlug) // Add slugs to headings for linking
    .use(rehypeAutolinkHeadings, {
      // Add self-links to headings
      behavior: "wrap", // or 'append', 'prepend'
      properties: {
        className: ["anchor"], // Optional: class for styling the link
      },
    })
    .use(rehypeStringify); // Convert HTML AST to string

  const result = await processor.process(markdownContent);
  const contentHtml = result.toString();

  return contentHtml;
};
