"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { fetchPostsMetaData } from "@/lib/data";

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

export async function fetchAdminPostsMetaData(
  startFrom: number,
  numberOfPosts: number,
  includeDraft: boolean,
  order: "asc" | "desc",
) {
  return fetchPostsMetaData(startFrom, numberOfPosts, includeDraft, order);
}
