"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, ImageIcon, Upload } from "lucide-react";

import "katex/dist/katex.min.css";
import "prism-themes/themes/prism-one-dark.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderPreview } from "@/lib/admin-actions";
import { MOCK_IMAGES, type MockImage } from "@/components/admin/mock-data";
import type { Post } from "@/types/posts";

const DATE_FORMAT = "yyyy/MM/dd";

type PostEditorProps = {
  /** 編集時の初期値（新規作成時は省略） */
  initialPost?: Partial<Post>;
  /** カテゴリー候補（既存カテゴリー）。本実装では DISTINCT 取得に差し替え */
  categories: string[];
  /** 挿入可能な画像一覧。本実装では R2 一覧取得に差し替え */
  images?: MockImage[];
};

export default function PostEditor({
  initialPost,
  categories,
  images = MOCK_IMAGES,
}: PostEditorProps) {
  const isExistingPublic = initialPost?.is_public === true;

  const [title, setTitle] = React.useState(initialPost?.title ?? "");
  const [slug, setSlug] = React.useState(initialPost?.slug ?? "");
  const [category, setCategory] = React.useState(initialPost?.category ?? "");
  const [content, setContent] = React.useState(initialPost?.content ?? "");

  // 公開日: テキスト（yyyy/MM/dd）とカレンダーを相互同期
  const initialDate = initialPost?.published_at
    ? new Date(initialPost.published_at)
    : undefined;
  const [date, setDate] = React.useState<Date | undefined>(initialDate);
  const [dateText, setDateText] = React.useState(
    initialDate && isValid(initialDate) ? format(initialDate, DATE_FORMAT) : "",
  );

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ---- 公開日の同期 ----
  function handleDateTextChange(value: string) {
    setDateText(value);
    const parsed = parse(value, DATE_FORMAT, new Date());
    setDate(isValid(parsed) ? parsed : undefined);
  }

  function handleCalendarSelect(selected: Date | undefined) {
    setDate(selected);
    setDateText(selected ? format(selected, DATE_FORMAT) : "");
  }

  // ---- 本文カーソル位置への挿入 ----
  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    // 挿入後にキャレットを挿入文の末尾へ復元
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold">
        {initialPost ? "記事を編集" : "記事を新規作成"}
      </h1>

      {/* タイトル */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="記事のタイトル"
        />
      </div>

      {/* slug */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">URL</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-first-post"
        />
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* カテゴリー（候補つき） */}
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="category">カテゴリー</Label>
          <CategoryAutocomplete
            value={category}
            onChange={setCategory}
            categories={categories}
          />
        </div>

        {/* 公開日（テキスト + カレンダー） */}
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="publishedAt">公開日</Label>
          <div className="flex gap-2">
            <Input
              id="publishedAt"
              value={dateText}
              onChange={(e) => handleDateTextChange(e.target.value)}
              placeholder="2026/06/28"
              className="flex-1"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" aria-label="カレンダーを開く">
                  <CalendarIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleCalendarSelect}
                  locale={ja}
                  captionLayout="dropdown"
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 本文（編集 / プレビュー）。画像挿入は編集タブ内・入力欄の直下に配置 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">本文</Label>
        <BodyTabs
          content={content}
          onChange={setContent}
          textareaRef={textareaRef}
          images={images}
          onInsert={insertAtCursor}
        />
      </div>

      {/* 保存 / 公開 */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() =>
            // モック: 永続化なし
            console.log("[mock] 下書き保存", { title, slug, category, dateText, content })
          }
        >
          下書き保存
        </Button>
        <Button
          onClick={() =>
            console.log("[mock] 公開/更新", { title, slug, category, dateText, content })
          }
        >
          {isExistingPublic ? "更新" : "公開"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        ※ これは UI モックです。保存・公開はまだ永続化されません。
      </p>
    </div>
  );
}

// ---- カテゴリー入力（テキストボックス + 既存候補サジェスト） ----
// 自由入力のテキストボックス。入力に応じて既存カテゴリーが候補として表示され、
// クリックで補完できる（新規カテゴリーはそのまま入力すればよい）。
function CategoryAutocomplete({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}) {
  const [open, setOpen] = React.useState(false);
  // 上下矢印でハイライト中の候補（-1 = 未選択）
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  // 入力に部分一致する既存カテゴリー（完全一致は候補から除外）
  const suggestions = categories.filter(
    (c) =>
      c.toLowerCase().includes(query) && c.toLowerCase() !== query,
  );

  // 入力が変わったらハイライトをリセット
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  // 外側クリックで候補を閉じる
  React.useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      // 候補リスト内を循環
      if (suggestions.length > 0) {
        setActiveIndex((i) => (i + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // 候補リスト内を循環
      if (suggestions.length > 0) {
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      }
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        select(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="category"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="カテゴリーを入力（既存の候補が表示されます）"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {suggestions.map((c, i) => (
            <li key={c}>
              <button
                type="button"
                className={
                  "w-full rounded-sm px-2 py-1.5 text-left " +
                  (i === activeIndex ? "bg-muted" : "hover:bg-muted")
                }
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- 画像挿入オーバーレイ ----
function ImagePickerDialog({
  images,
  onInsert,
}: {
  images: MockImage[];
  onInsert: (snippet: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<MockImage | null>(null);
  const [caption, setCaption] = React.useState("");

  function handlePaste() {
    if (!selected) return;
    const alt = caption.trim();
    // lib/markdown.ts が解釈する形式: ![alt](images/x.png "caption")
    const snippet = alt
      ? `![${alt}](${selected.key} "${alt}")`
      : `![](${selected.key})`;
    onInsert(`\n\n${snippet}\n\n`);
    // リセットして閉じる
    setOpen(false);
    setSelected(null);
    setCaption("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <ImageIcon />
          画像を挿入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>画像を挿入</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {images.map((img) => {
            const isActive = selected?.key === img.key;
            return (
              <button
                key={img.key}
                type="button"
                onClick={() => setSelected(img)}
                className={
                  "overflow-hidden rounded-md border transition-colors " +
                  (isActive
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-foreground/40")
                }
                aria-pressed={isActive}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.key}
                  className="aspect-[3/2] w-full object-cover"
                />
                <span className="block truncate px-1 py-0.5 text-[10px] text-muted-foreground">
                  {img.key}
                </span>
              </button>
            );
          })}
        </div>

        {/* TODO: 画像アップロード機能（R2 へのアップロード）は別フェーズで実装 */}
        <div>
          <Button variant="outline" size="sm">
            <Upload />
            画像を追加
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="caption">キャプション</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button onClick={handlePaste} disabled={!selected}>
            貼り付け
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 本文の編集 / プレビュー切替 ----
function BodyTabs({
  content,
  onChange,
  textareaRef,
  images,
  onInsert,
}: {
  content: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  images: MockImage[];
  onInsert: (snippet: string) => void;
}) {
  const [tab, setTab] = React.useState("edit");
  const [html, setHtml] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleTabChange(next: string) {
    setTab(next);
    if (next === "preview") {
      setLoading(true);
      try {
        setHtml(await renderPreview(content));
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="edit">編集</TabsTrigger>
        <TabsTrigger value="preview">プレビュー</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="flex flex-col gap-2">
        <Textarea
          id="content"
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Markdown で本文を入力…"
          className="min-h-100 font-mono"
        />
        <div>
          <ImagePickerDialog images={images} onInsert={onInsert} />
        </div>
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-100 rounded-lg border p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">プレビューを生成中…</p>
          ) : content.trim() === "" ? (
            <p className="text-sm text-muted-foreground">本文がありません。</p>
          ) : (
            <article
              className="article article-preview"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
