"use client";

import { useEffect } from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Error in page:", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">
        申し訳ありません、記事の読み込みに失敗しました。
      </h2>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => location.reload()}
      >
        再試行
      </button>
    </div>
  );
}
