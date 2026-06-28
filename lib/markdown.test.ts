import { describe, it, expect } from "vitest";
import { renderMarkdownToHTML } from "@/lib/markdown";

// 画像/動画/音声の振り分け・公開 URL 書き換え・figcaption 化を検証する。
// （手動 E2E で確認が面倒な「画像/動画貼り付け」の肝をここで担保する）
describe("renderMarkdownToHTML — メディア振り分け", () => {
  it("画像は <figure><img> に変換し、src を絶対化、title を figcaption 化する", async () => {
    const html = await renderMarkdownToHTML('![笑顔](media/smile.png "素敵な笑顔")');
    expect(html).toContain("<figure>");
    expect(html).toContain("<img");
    expect(html).toContain('src="https://cdn.example.test/media/smile.png"');
    expect(html).toContain("<figcaption>素敵な笑顔</figcaption>");
  });

  it("動画拡張子は <video controls> に変換する", async () => {
    const html = await renderMarkdownToHTML("![](media/clip.mp4)");
    expect(html).toContain("<video");
    expect(html).toContain("controls");
    expect(html).toContain('src="https://cdn.example.test/media/clip.mp4"');
    expect(html).not.toContain("<img");
  });

  it("音声拡張子は <audio controls> に変換する", async () => {
    const html = await renderMarkdownToHTML("![](media/song.mp3)");
    expect(html).toContain("<audio");
    expect(html).toContain("controls");
    expect(html).toContain('src="https://cdn.example.test/media/song.mp3"');
  });

  it("動画にもキャプション（figcaption）が付く", async () => {
    const html = await renderMarkdownToHTML('![](media/demo.webm "デモ動画")');
    expect(html).toContain("<video");
    expect(html).toContain("<figcaption>デモ動画</figcaption>");
  });

  it("title 内のエスケープされた \" が figcaption に正しく戻る", async () => {
    // buildMediaSnippet が生成する形（" は \" にエスケープ）
    const html = await renderMarkdownToHTML(
      '![cap](media/a.png "say \\"hi\\"")',
    );
    expect(html).toContain('<figcaption>say "hi"</figcaption>');
  });
});
