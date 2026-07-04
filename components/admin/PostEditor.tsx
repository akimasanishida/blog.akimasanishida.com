"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parse, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  FileIcon,
  ImageIcon,
  Loader2,
  Music,
  Upload,
  X,
} from "lucide-react";

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
import {
  savePost,
  checkSlugAvailability,
  togglePublicAction,
} from "@/lib/post-actions";
import { uploadMediaAction } from "@/lib/actions";
import {
  SLUG_PATTERN,
  buildMediaSnippet,
  mediaDisplayName,
} from "@/lib/post-format";
import type { MediaObject } from "@/types/media";
import type { Post } from "@/types/posts";

const DATE_FORMAT = "yyyy/MM/dd";

type PostEditorProps = {
  /** 編集時の初期値（新規作成時は省略） */
  initialPost?: Partial<Post>;
  /** カテゴリー候補（既存カテゴリーの DISTINCT） */
  categories: string[];
  /** 挿入可能なメディア一覧（R2 の画像・動画・音声など） */
  media: MediaObject[];
};

export default function PostEditor({
  initialPost,
  categories,
  media,
}: PostEditorProps) {
  const router = useRouter();
  const isExistingPublic = initialPost?.is_public === true;

  const [title, setTitle] = React.useState(initialPost?.title ?? "");
  const [slug, setSlug] = React.useState(initialPost?.slug ?? "");
  const [slugStatus, setSlugStatus] = React.useState<SlugStatus>("idle");
  const [category, setCategory] = React.useState(initialPost?.category ?? "");
  const [content, setContent] = React.useState(initialPost?.content ?? "");

  // 公開/更新の可否: タイトルと有効な URL（書式 OK かつ使用済みでない）が揃ったとき。
  // 下書き保存は常に可能（保存中の二重送信防止のみ）。
  const slugFormatValid = slug.trim() !== "" && SLUG_PATTERN.test(slug.trim());
  const canPublish =
    title.trim() !== "" && slugFormatValid && slugStatus !== "taken";

  // 公開日: テキスト（yyyy/MM/dd）とカレンダーを相互同期
  const initialDate = initialPost?.published_at
    ? new Date(initialPost.published_at)
    : undefined;
  const initialDateText =
    initialDate && isValid(initialDate) ? format(initialDate, DATE_FORMAT) : "";
  const [date, setDate] = React.useState<Date | undefined>(initialDate);
  const [dateText, setDateText] = React.useState(initialDateText);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ---- 未保存の変更（dirty）検知 ----
  // 保存時点の値を基準に、いずれかが変わっていれば「未保存」とみなす。
  const [baseline, setBaseline] = React.useState({
    title: initialPost?.title ?? "",
    slug: initialPost?.slug ?? "",
    category: initialPost?.category ?? "",
    content: initialPost?.content ?? "",
    dateText: initialDateText,
  });
  const isDirty =
    title !== baseline.title ||
    slug !== baseline.slug ||
    category !== baseline.category ||
    content !== baseline.content ||
    dateText !== baseline.dateText;

  // popstate ハンドラ（mount 時に 1 度だけ登録）から最新の dirty を参照するための ref。
  const isDirtyRef = React.useRef(isDirty);
  React.useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // 保存に伴う意図的な遷移（新規作成後の redirect 等）中は離脱警告を抑止する。
  // 本番（workerd）ではこの redirect がハードナビゲーションになり、dirty のまま
  // unload されて beforeunload が誤発火するため、保存中はガードを一律で無効化する。
  const isSavingRef = React.useRef(false);

  // ---- 保存・公開 ----
  const [isSaving, startSaving] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    { type: "error" | "success"; text: string } | null
  >(null);

  function handleSave(intent: "draft" | "publish") {
    // 公開・更新は取り消しにくい操作なので確認する。
    if (intent === "publish") {
      const message = isExistingPublic
        ? "記事を更新します。よろしいですか？"
        : "記事を公開します。よろしいですか？";
      if (!window.confirm(message)) return;
    }

    setFeedback(null);
    // 離脱警告の抑止は「新規作成（成功時に編集ページへ redirect する）」のときだけ。
    // 既存記事の更新は redirect せず（router.refresh のみ）誤発火しないので、保存中も
    // 離脱ガードを効かせたままにする（通信失敗時の未保存離脱を見逃さない）。
    isSavingRef.current = !initialPost?.id;
    startSaving(async () => {
      try {
        const result = await savePost({
          id: initialPost?.id,
          title,
          slug,
          category,
          content,
          publishedAtText: dateText,
          intent,
        });
        // 新規作成成功時は Server Action が編集ページへ redirect するため、
        // ここに戻ってくるのはエラー時か既存記事の更新成功時のみ。
        if (result?.status === "error") {
          // 保存失敗＝遷移しないので、ガードを再武装する。
          isSavingRef.current = false;
          setFeedback({ type: "error", text: result.message });
        } else {
          // 保存できたので dirty 基準を現在値に更新（離脱警告を解除）。
          setBaseline({ title, slug, category, content, dateText });
          isSavingRef.current = false;
          setFeedback(
            result?.status === "success"
              ? { type: "success", text: result.message }
              : null,
          );
          router.refresh();
        }
      } catch (error) {
        // redirect() 由来（NEXT_REDIRECT）は正常な遷移。握りつぶすとナビゲーションが
        // 壊れるので、そのまま再 throw する。
        const digest = (error as { digest?: unknown }).digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        // それ以外の例外（通信失敗等）は保存フラグを再武装し、離脱警告を復活させる
        // （true のまま残すと未保存の変更が黙って失われうるため）。
        isSavingRef.current = false;
        setFeedback({ type: "error", text: "保存に失敗しました。" });
      }
    });
  }

  // 既存の公開記事を下書きに戻す（公開ページから外す）。本文の編集内容には触れない。
  function handleRevertToDraft() {
    const id = initialPost?.id;
    if (!id) return;
    if (!window.confirm("この記事を下書きに戻しますか？　公開ページから外れます。")) {
      return;
    }
    setFeedback(null);
    startSaving(async () => {
      const result = await togglePublicAction(id, false);
      if (result?.status === "error") {
        setFeedback({ type: "error", text: result.message });
      } else {
        setFeedback({ type: "success", text: "下書きに戻しました。" });
        router.refresh();
      }
    });
  }

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

  // ---- 離脱警告（未保存の変更があるとき）----
  // beforeunload はリロード/タブを閉じる/外部遷移をカバー。
  // App Router にはルート遷移フックが無いため、アンカークリックを捕捉して
  // アプリ内のリンク遷移（ヘッダー等）も確認する。
  React.useEffect(() => {
    if (!isDirty) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isSavingRef.current) return; // 保存に伴う遷移は警告しない
      e.preventDefault();
      e.returnValue = "";
    }

    function onClickCapture(e: MouseEvent) {
      if (isSavingRef.current) return; // 保存に伴う遷移は警告しない
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return; // 新規タブ等は通す
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (
        !window.confirm("未保存の変更があります。このページを離れますか？")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [isDirty]);

  // ---- 戻る/進む（back/forward）対策 ----
  // モダンブラウザは Navigation API で戻る/進む（traverse）だけを横取りして確認する
  // （sentinel 不要・履歴を汚さず、preventDefault で確実に留まれる）。非対応ブラウザは
  // history sentinel + popstate にフォールバック。push/replace（保存後の redirect /
  // refresh・リンク遷移）は対象外なので保存フローに干渉しない。
  React.useEffect(() => {
    type NavEventLike = {
      navigationType: string;
      cancelable: boolean;
      preventDefault(): void;
    };
    type NavLike = {
      addEventListener(t: "navigate", cb: (e: NavEventLike) => void): void;
      removeEventListener(t: "navigate", cb: (e: NavEventLike) => void): void;
    };
    const nav = (window as unknown as { navigation?: NavLike }).navigation;
    const message = "未保存の変更があります。このページを離れますか？";

    if (nav) {
      const onNavigate = (e: NavEventLike) => {
        if (e.navigationType !== "traverse" || !e.cancelable) return;
        if (isSavingRef.current) return; // 保存に伴う遷移は警告しない
        if (isDirtyRef.current && !window.confirm(message)) {
          e.preventDefault(); // 留まる
        }
      };
      nav.addEventListener("navigate", onNavigate);
      return () => nav.removeEventListener("navigate", onNavigate);
    }

    // フォールバック: sentinel を積んで popstate で受け止める。
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      if (isSavingRef.current) return; // 保存に伴う遷移は警告しない
      if (isDirtyRef.current && !window.confirm(message)) {
        window.history.pushState(null, "", window.location.href); // 留まる
        return;
      }
      // 離脱: popstate 中の history.back() は無視されることがあるため遅延実行。
      window.removeEventListener("popstate", onPopState);
      setTimeout(() => window.history.back(), 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
    <div className="container mx-auto flex flex-col gap-4 py-4">
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

      {/* slug（重複チェック付き） */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">URL</Label>
        <SlugInput
          value={slug}
          onChange={setSlug}
          excludeId={initialPost?.id}
          onStatusChange={setSlugStatus}
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
              placeholder="yyyy/mm/dd"
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

      {/* 本文（編集 / プレビュー）。メディア挿入は編集タブ内・入力欄の直下に配置 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">本文</Label>
        <BodyTabs
          content={content}
          onChange={setContent}
          textareaRef={textareaRef}
          media={media}
          onInsert={insertAtCursor}
        />
      </div>

      {/* 保存 / 公開 */}
      <div className="flex flex-col gap-2">
        {feedback && (
          <p
            className={
              "self-end text-sm " +
              (feedback.type === "error"
                ? "text-destructive"
                : "text-muted-foreground")
            }
          >
            {feedback.text}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {/* 既存の公開記事のみ: 下書きに戻す */}
          {isExistingPublic && (
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={handleRevertToDraft}
            >
              下書きに戻す
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            <Button
              variant="secondary"
              disabled={isSaving}
              onClick={() => handleSave("draft")}
            >
              {isSaving ? "保存中…" : "下書き保存"}
            </Button>
            <Button
              disabled={isSaving || !canPublish}
              onClick={() => handleSave("publish")}
            >
              {isSaving ? "保存中…" : isExistingPublic ? "更新" : "公開"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- URL（slug）入力 + 重複チェック ----
// 入力が変わるたびに少し待ってから（デバウンス）サーバーへ重複チェックし、
// 右側に緑（使用可能）/ 赤（使用済み・不正）/ 確認中スピナーで状態表示する。
const SLUG_CHECK_DEBOUNCE_MS = 500;

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function SlugInput({
  value,
  onChange,
  excludeId,
  onStatusChange,
}: {
  value: string;
  onChange: (value: string) => void;
  excludeId?: string;
  onStatusChange?: (status: SlugStatus) => void;
}) {
  const [status, setStatus] = React.useState<SlugStatus>("idle");

  // 親（公開ボタンの活性判定）へ最新ステータスを通知。
  React.useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  React.useEffect(() => {
    const slug = value.trim();
    if (!slug) {
      setStatus("idle");
      return;
    }
    if (!SLUG_PATTERN.test(slug)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(slug, excludeId);
        if (cancelled) return;
        // empty/invalid は上で弾いているが、念のため available 以外は taken 扱い。
        setStatus(result.status === "available" ? "available" : "taken");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    }, SLUG_CHECK_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, excludeId]);

  return (
    <div className="flex items-center gap-2">
      <Input
        id="slug"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="my-article-title"
        className="flex-1"
        autoComplete="off"
        aria-invalid={status === "taken" || status === "invalid"}
      />
      <SlugStatusBadge status={status} />
    </div>
  );
}

function SlugStatusBadge({ status }: { status: SlugStatus }) {
  if (status === "idle") return null;

  const base = "inline-flex shrink-0 items-center gap-1 text-sm";
  if (status === "checking") {
    return (
      <span className={`${base} text-muted-foreground`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        確認中…
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className={`${base} text-green-600 dark:text-green-500`}>
        <Check className="h-4 w-4" />
        使用可能
      </span>
    );
  }
  if (status === "taken") {
    return (
      <span className={`${base} text-destructive`}>
        <X className="h-4 w-4" />
        使用済み
      </span>
    );
  }
  // invalid
  return (
    <span className={`${base} text-destructive`}>
      <AlertCircle className="h-4 w-4" />
      使用できない文字
    </span>
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

// グリッドのプレビュー。画像は表示、動画/音声はその場で再生できるプレイヤー、
// その他は種別アイコン。media-manager の MediaPreview と同様に素の要素で描画する。
function MediaPreview({ item }: { item: MediaObject }) {
  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.key}
        className="aspect-[4/3] w-full bg-muted object-contain"
      />
    );
  }
  if (item.kind === "video") {
    return (
      <video
        src={item.url}
        controls
        preload="metadata"
        className="aspect-[4/3] w-full bg-black object-contain"
      />
    );
  }
  if (item.kind === "audio") {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted px-2 text-muted-foreground">
        <Music className="h-7 w-7" />
        <audio src={item.url} controls preload="metadata" className="w-full" />
      </div>
    );
  }
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
      <FileIcon className="h-8 w-8" />
      <span className="text-[10px] uppercase">{item.kind}</span>
    </div>
  );
}

// ---- メディア挿入オーバーレイ ----
function MediaPickerDialog({
  media,
  onInsert,
}: {
  media: MediaObject[];
  onInsert: (snippet: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<MediaObject | null>(null);
  const [caption, setCaption] = React.useState("");

  // メディアアップロード（既存の uploadMediaAction を再利用）
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, startUploading] = React.useTransition();
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);
    e.target.value = ""; // 同じファイルを選び直せるようリセット
    setUploadError(null);
    startUploading(async () => {
      try {
        const result = await uploadMediaAction(undefined, formData);
        if (result?.status === "error") {
          setUploadError(result.message);
        } else {
          // サーバー側 listMedia() を再取得してグリッドへ反映
          router.refresh();
        }
      } catch {
        setUploadError(
          "ファイルサイズが上限の25 MB を超えるため、アップロードできませんでした。",
        );
      }
    });
  }

  function handlePaste() {
    if (!selected) return;
    onInsert(`\n\n${buildMediaSnippet(selected, caption)}\n\n`);
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
          メディアを挿入
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-4xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>メディアを挿入</DialogTitle>
        </DialogHeader>

        {media.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            メディアがまだありません。「メディアを追加」からアップロードしてください。
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3">
            {media.map((item) => {
              const isActive = selected?.key === item.key;
              return (
                <div
                  key={item.key}
                  className={
                    "relative flex flex-col overflow-hidden rounded-lg border-2 transition-colors " +
                    (isActive ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border")
                  }
                >
                  {/* プレビューは自由に操作（再生）できる */}
                  <MediaPreview item={item} />
                  {isActive && (
                    <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span
                      className="truncate text-xs text-muted-foreground"
                      title={mediaDisplayName(item.key)}
                    >
                      {mediaDisplayName(item.key)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="shrink-0"
                      onClick={() => setSelected(item)}
                      aria-pressed={isActive}
                    >
                      {isActive ? "選択中" : "選択"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* メディアアップロード（R2）。成功後はサーバー再取得でグリッドへ反映 */}
        <div className="flex flex-col gap-1">
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={handleUploadChange}
          />
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => uploadInputRef.current?.click()}
            >
              <Upload />
              {isUploading ? "アップロード中…" : "メディアを追加"}
            </Button>
          </div>
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="caption">キャプション（任意）</Label>
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
  media,
  onInsert,
}: {
  content: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  media: MediaObject[];
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
          className="h-100 resize-none overflow-y-auto font-mono field-sizing-fixed"
        />
        <div>
          <MediaPickerDialog media={media} onInsert={onInsert} />
        </div>
      </TabsContent>
      <TabsContent value="preview">
        <div className="h-100 overflow-y-auto rounded-lg border p-4">
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
