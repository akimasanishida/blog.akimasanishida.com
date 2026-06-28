export type MediaKind = "image" | "video" | "audio" | "other";

export type MediaObject = {
  key: string; // R2 上のキー（例: media/foo.png）
  size: number; // bytes
  lastModified: string; // ISO 文字列（serialize して client へ渡す）
  contentType: string; // mime-types から推定
  kind: MediaKind;
  url: string; // NEXT_PUBLIC_STORAGE_PUBLIC_URL + "/" + key
};
