import { describe, it, expect } from "vitest";
import {
  SLUG_PATTERN,
  toTokyoISODate,
  mediaDisplayName,
  buildMediaSnippet,
} from "@/lib/post-format";
import type { MediaObject } from "@/types/media";

function media(over: Partial<MediaObject>): MediaObject {
  return {
    key: "media/x.png",
    size: 0,
    lastModified: "",
    contentType: "image/png",
    kind: "image",
    url: "https://cdn.example.test/media/x.png",
    ...over,
  };
}

describe("SLUG_PATTERN", () => {
  it("有効な slug を許可する", () => {
    expect(SLUG_PATTERN.test("my-article-title")).toBe(true);
    expect(SLUG_PATTERN.test("a_b.c-1")).toBe(true);
  });
  it("空白・非 ASCII・スラッシュ・空文字を弾く", () => {
    expect(SLUG_PATTERN.test("with space")).toBe(false);
    expect(SLUG_PATTERN.test("日本語")).toBe(false);
    expect(SLUG_PATTERN.test("a/b")).toBe(false);
    expect(SLUG_PATTERN.test("")).toBe(false);
  });
});

describe("toTokyoISODate", () => {
  it("yyyy/MM/dd を +09:00 の ISO に変換する（ゼロ埋め込み）", () => {
    expect(toTokyoISODate("2026/06/28")).toBe("2026-06-28T00:00:00+09:00");
    expect(toTokyoISODate("2026/6/3")).toBe("2026-06-03T00:00:00+09:00");
  });
  it("形式不正は null", () => {
    expect(toTokyoISODate("")).toBeNull();
    expect(toTokyoISODate("2026-06-28")).toBeNull();
    expect(toTokyoISODate("June 28")).toBeNull();
  });
  it("実在しない暦日は null（繰り上がりを弾く）", () => {
    expect(toTokyoISODate("2026/02/30")).toBeNull();
    expect(toTokyoISODate("2026/13/01")).toBeNull();
    expect(toTokyoISODate("2026/99/99")).toBeNull();
    expect(toTokyoISODate("2026/02/29")).toBeNull(); // 平年
  });
  it("実在する閏日は許可する", () => {
    expect(toTokyoISODate("2024/02/29")).toBe("2024-02-29T00:00:00+09:00");
  });
});

describe("mediaDisplayName", () => {
  it("media/ prefix を落とす", () => {
    expect(mediaDisplayName("media/smile.png")).toBe("smile.png");
    expect(mediaDisplayName("smile.png")).toBe("smile.png");
  });
});

describe("buildMediaSnippet", () => {
  it("画像（キャプションあり/なし）", () => {
    expect(buildMediaSnippet(media({ key: "media/a.png" }), "猫")).toBe(
      '![猫](media/a.png "猫")',
    );
    expect(buildMediaSnippet(media({ key: "media/a.png" }), "")).toBe(
      "![](media/a.png)",
    );
  });
  it("動画・音声も画像と同じ相対キー記法で挿入する", () => {
    expect(
      buildMediaSnippet(media({ key: "media/v.mp4", kind: "video" }), "デモ"),
    ).toBe('![デモ](media/v.mp4 "デモ")');
    expect(
      buildMediaSnippet(media({ key: "media/s.mp3", kind: "audio" }), ""),
    ).toBe("![](media/s.mp3)");
  });
  it("キャプション内の \" を title でエスケープする", () => {
    expect(
      buildMediaSnippet(media({ key: "media/a.png" }), 'He said "hi"'),
    ).toBe('![He said "hi"](media/a.png "He said \\"hi\\"")');
  });
  it("その他ファイルは絶対 URL のリンクにする", () => {
    expect(
      buildMediaSnippet(
        media({
          key: "media/f.zip",
          kind: "other",
          url: "https://cdn.example.test/media/f.zip",
        }),
        "",
      ),
    ).toBe("[f.zip](https://cdn.example.test/media/f.zip)");
  });
});
