import type { Metadata } from "next";
import { listMedia } from "@/lib/storage";
import MediaManager from "./media-manager";

export const metadata: Metadata = { title: "メディア管理" };

export default async function Page() {
  const media = await listMedia();

  return (
    <div className="flex flex-col container mx-auto py-10 gap-8">
      <MediaManager media={media} />
    </div>
  );
}
