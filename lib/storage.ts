import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import mime from "mime-types";
import type { MediaKind, MediaObject } from "@/types/media";

// postgres クライアント（lib/data.ts）同様、module スコープで 1 度だけ生成する。
const s3 = new S3Client({
  region: "auto", // AWS SDK が要求するが R2 では未使用
  endpoint: process.env.STORAGE_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.STORAGE_BUCKET_NAME!;

// メディアはすべてこの prefix（= media フォルダ）配下に保存・列挙する。
// S3/R2 に実体としてのフォルダは無く、キーの prefix が自動的に「フォルダ」になる。
const MEDIA_PREFIX = "media/";

function kindFromContentType(contentType: string): MediaKind {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "other";
}

// ブラウザが File.type を空で渡す形式（一部の動画等）があるため、
// 申告 MIME が無ければ拡張子から推定する。
export function resolveContentType(
  declared: string | undefined,
  filename: string,
): string {
  if (declared && declared.length > 0) return declared;
  return mime.lookup(filename) || "application/octet-stream";
}

function publicUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL}/${key}`;
}

export async function listMedia(): Promise<MediaObject[]> {
  const objects: MediaObject[] = [];
  let continuationToken: string | undefined;

  // R2/S3 は 1 リクエスト最大 1000 件なので continuation で全件取得する。
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: MEDIA_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      const contentType = mime.lookup(obj.Key) || "application/octet-stream";
      objects.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: (obj.LastModified ?? new Date()).toISOString(),
        contentType,
        kind: kindFromContentType(contentType),
        url: publicUrl(obj.Key),
      });
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  // 新しい順。
  objects.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  return objects;
}

export async function putMedia(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function removeMedia(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function mediaKeyExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (error) {
    // オブジェクト不在は 404 / NotFound。それ以外は本物のエラーとして再 throw。
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404) {
      return false;
    }
    throw error;
  }
}

// ファイル名をサニタイズし、media/ prefix を付与（衝突チェックなし）。
function buildMediaKey(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  const rawBase = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const rawExt = dotIndex > 0 ? filename.slice(dotIndex + 1) : "";

  // 日本語などの非 ASCII 名も残す。キー/URL で問題になる文字（空白・パス区切り・
  // 制御文字・URL 予約記号の一部）のみ除去/置換する。
  const sanitize = (s: string) =>
    s
      .normalize("NFC")
      .replace(/\s+/g, "-")
      .replace(/[/\\?%*:|"<>#]/g, "")
      .replace(/[\x00-\x1f]/g, "")
      .replace(/^[-.]+|[-.]+$/g, "");

  const base = sanitize(rawBase) || "file";
  const ext = sanitize(rawExt);
  const suffix = ext ? `.${ext}` : "";
  return `${MEDIA_PREFIX}${base}${suffix}`;
}

// 同名キーが既に存在する場合は `-1`, `-2`... を付けて上書きを防ぐ。
async function ensureUniqueKey(candidate: string): Promise<string> {
  const dotIndex = candidate.lastIndexOf(".");
  const hasExt = dotIndex > MEDIA_PREFIX.length;
  const base = hasExt ? candidate.slice(0, dotIndex) : candidate;
  const suffix = hasExt ? candidate.slice(dotIndex) : "";

  let key = candidate;
  let counter = 0;
  while (await mediaKeyExists(key)) {
    counter += 1;
    key = `${base}-${counter}${suffix}`;
  }
  return key;
}

// アップロード用：サニタイズ済みかつ衝突しないキーを返す。
export async function resolveMediaKey(filename: string): Promise<string> {
  return ensureUniqueKey(buildMediaKey(filename));
}

// リネーム：S3/R2 にリネームは無いのでコピー → 旧キー削除で実現する。
// 新しい名前に拡張子が無ければ元キーの拡張子を引き継ぐ。返り値は新キー。
export async function renameMedia(
  oldKey: string,
  newFilename: string,
): Promise<string> {
  let name = newFilename;
  if (!/\.[^./\\]+$/.test(name)) {
    const oldDot = oldKey.lastIndexOf(".");
    if (oldDot > MEDIA_PREFIX.length) name += oldKey.slice(oldDot);
  }

  const target = buildMediaKey(name);
  if (target === oldKey) return oldKey; // 実質変更なし

  const newKey = await ensureUniqueKey(target);
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      // CopySource は URL エンコードが必要（日本語キー等のため）。
      CopySource: encodeURIComponent(`${BUCKET}/${oldKey}`),
      Key: newKey,
    }),
  );
  await removeMedia(oldKey);
  return newKey;
}
