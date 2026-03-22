export interface Post {
  id?: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  published_at: string | null;
  updated_at: string | null;
  category: string | null;
  content: string | null;
  is_public: boolean;
}