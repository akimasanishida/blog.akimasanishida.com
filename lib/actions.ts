"use server";

import { revalidatePath } from "next/cache";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
  putMedia,
  removeMedia,
  renameMedia,
  resolveContentType,
  resolveMediaKey,
} from "@/lib/storage";

export type MediaActionState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "メールアドレスまたはパスワードが間違っています。";
        default:
          return "ログインに失敗しました。もう一度お試しください。";
      }
    }
    throw error;
  }
}

const ACCEPTED_MEDIA = /^(image|video|audio)\//;

export async function uploadMediaAction(
  prevState: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { status: "error", message: "ファイルが選択されていません。" };
  }

  try {
    let uploaded = 0;
    for (const file of files) {
      const contentType = resolveContentType(file.type, file.name);
      if (!ACCEPTED_MEDIA.test(contentType)) {
        return {
          status: "error",
          message: `「${file.name}」は対応していない形式です（画像・動画・音声のみ）。`,
        };
      }
      const body = Buffer.from(await file.arrayBuffer());
      const key = await resolveMediaKey(file.name);
      await putMedia(key, body, contentType);
      uploaded += 1;
    }
    revalidatePath("/admin/media");
    return { status: "success", message: `${uploaded} 件アップロードしました。` };
  } catch (error) {
    console.error("Failed to upload media:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return { status: "error", message: `アップロードに失敗しました：${detail}` };
  }
}

export async function deleteMediaAction(
  prevState: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const key = formData.get("key");
  if (typeof key !== "string" || key.length === 0) {
    return { status: "error", message: "削除対象が指定されていません。" };
  }

  try {
    await removeMedia(key);
    revalidatePath("/admin/media");
    return { status: "success", message: "削除しました。" };
  } catch (error) {
    console.error("Failed to delete media:", error);
    return { status: "error", message: "削除に失敗しました。" };
  }
}

export async function renameMediaAction(
  prevState: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const key = formData.get("key");
  const name = formData.get("name");
  if (typeof key !== "string" || key.length === 0) {
    return { status: "error", message: "対象が指定されていません。" };
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return { status: "error", message: "ファイル名を入力してください。" };
  }

  try {
    await renameMedia(key, name.trim());
    revalidatePath("/admin/media");
    return { status: "success", message: "ファイル名を変更しました。" };
  } catch (error) {
    console.error("Failed to rename media:", error);
    return { status: "error", message: "ファイル名の変更に失敗しました。" };
  }
}
