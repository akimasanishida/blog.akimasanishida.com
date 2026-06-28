import PostEditor from "@/components/admin/PostEditor";
import { MOCK_CATEGORIES, MOCK_IMAGES } from "@/components/admin/mock-data";

// /admin 配下のため proxy.ts のミドルウェアで自動的に認証保護される。
export default function Page() {
  return <PostEditor categories={MOCK_CATEGORIES} images={MOCK_IMAGES} />;
}
