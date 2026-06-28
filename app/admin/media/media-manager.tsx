"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { FileIcon, Maximize2, Pencil, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  uploadMediaAction,
  deleteMediaAction,
  renameMediaAction,
  type MediaActionState,
} from "@/lib/actions";
import type { MediaObject } from "@/types/media";

// 保存キーは media/ 配下なので、表示時は prefix を落とす。
function displayName(key: string): string {
  return key.replace(/^media\//, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function StatusMessage({ state }: { state: MediaActionState }) {
  if (!state) return null;
  return (
    <p
      className={
        state.status === "error"
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground"
      }
    >
      {state.message}
    </p>
  );
}

function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MediaActionState>(undefined);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    // 同じファイルを連続で選び直せるよう input をリセット。
    e.target.value = "";

    startTransition(async () => {
      try {
        setState(await uploadMediaAction(undefined, formData));
      } catch {
        // body 上限超過などで Server Action のパース自体が失敗した場合は
        // アクション本体に到達せず reject される。ここで拾って通知する。
        // 文言中のサイズは next.config.ts の bodySizeLimit / proxyClientMaxBodySize と合わせること。
        setState({
          status: "error",
          message:
            "ファイルサイズが上限の25 MB を超えるため、アップロードできませんでした。",
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        disabled={isPending}
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {isPending ? "アップロード中…" : "アップロード"}
      </Button>
      <StatusMessage state={state} />
    </div>
  );
}

function DeleteForm({ media }: { media: MediaObject }) {
  const [, formAction, isPending] = useActionState(deleteMediaAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`「${media.key}」を削除しますか？　この操作は取り消せません。`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="key" value={media.key} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={isPending}
        className="gap-1"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? "削除中…" : "削除"}
      </Button>
    </form>
  );
}

function RenameDialog({ media }: { media: MediaObject }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName(media.key));
  const [state, setState] = useState<MediaActionState>(undefined);
  const [isPending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await renameMediaAction(undefined, formData);
      setState(result);
      if (result?.status === "success") setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // 開くたびに現在名にリセットし、前回のメッセージを消す。
        if (next) {
          setName(displayName(media.key));
          setState(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
          title="ファイル名を変更"
          aria-label="ファイル名を変更"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ファイル名を変更</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          <input type="hidden" name="key" value={media.key} />
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <StatusMessage state={state} />
          <Button type="submit" disabled={isPending}>
            {isPending ? "変更中…" : "変更"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MediaPreview({
  media,
  onOpenImage,
}: {
  media: MediaObject;
  onOpenImage: (media: MediaObject) => void;
}) {
  if (media.kind === "image") {
    return (
      <button
        type="button"
        onClick={() => onOpenImage(media)}
        className="group relative block overflow-hidden rounded"
        title="クリックで拡大"
      >
        {/* R2 の任意ホストを next/image に登録せず、Markdown 描画（lib/markdown.ts）と
            同様に素の <img> でプレビューする。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.key}
          className="h-40 w-full object-contain bg-muted transition group-hover:opacity-80"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
          <Maximize2 className="h-6 w-6 text-white drop-shadow" />
        </span>
      </button>
    );
  }
  if (media.kind === "video") {
    return <video src={media.url} controls className="h-40 w-full rounded bg-muted" />;
  }
  if (media.kind === "audio") {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded bg-muted px-2">
        <audio src={media.url} controls className="w-full" />
      </div>
    );
  }
  return (
    <div className="flex h-40 w-full items-center justify-center rounded bg-muted">
      <FileIcon className="h-12 w-12 text-muted-foreground" />
    </div>
  );
}

export default function MediaManager({ media }: { media: MediaObject[] }) {
  const [lightbox, setLightbox] = useState<MediaObject | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">メディア管理</h1>
        <UploadButton />
      </div>

      {media.length === 0 ? (
        <p className="text-muted-foreground">メディアがまだありません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <MediaPreview media={item} onOpenImage={setLightbox} />
              <div className="flex items-center gap-1">
                <p
                  className="truncate text-sm font-medium"
                  title={displayName(item.key)}
                >
                  {displayName(item.key)}
                </p>
                <RenameDialog media={item} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatSize(item.size)}
              </p>
              <div className="mt-auto flex justify-end">
                <DeleteForm media={item} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 画像クリックで開く拡大オーバーレイ */}
      <Dialog
        open={!!lightbox}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="w-auto max-w-[95vw] border-0 bg-transparent p-0 shadow-none"
        >
          {lightbox && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{displayName(lightbox.key)}</DialogTitle>
              </DialogHeader>
              <DialogClose className="absolute -top-3 -right-3 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90 focus:ring-2 focus:ring-white focus:outline-none">
                <X className="h-6 w-6" />
                <span className="sr-only">閉じる</span>
              </DialogClose>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.url}
                alt={displayName(lightbox.key)}
                className="block max-h-[85vh] max-w-[95vw] w-auto rounded object-contain"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
