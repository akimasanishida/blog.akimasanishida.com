import { Calendar, RotateCcw } from "lucide-react";

export default function PostMetadata({
  publishedAt,
  updatedAt,
  category,
}: {
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: string | null;
}) {
  const optionsLocaleString: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const strPublishedAt = publishedAt
    ? new Date(publishedAt).toLocaleString("ja-JP", optionsLocaleString)
    : null;
  const strUpdatedAt = updatedAt
    ? new Date(updatedAt).toLocaleDateString("ja-JP", optionsLocaleString)
    : null;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center mb-1 gap-x-4">
        {strPublishedAt && (
          <div className="flex items-center text-(--muted-foreground)">
            <Calendar className="inline-block w-5 h-5 mr-2" />
            {strPublishedAt}
          </div>
        )}
        {strUpdatedAt && (
          <div className="flex items-center text-(--muted-foreground)">
            <RotateCcw className="inline-block w-5 h-5 mr-2" />
            {strUpdatedAt}
          </div>
        )}
      </div>
      {category && (
        <div className="text-(--muted-foreground)">カテゴリー: <span className="font-semibold">{category}</span></div>
      )}
    </>
  );
}
