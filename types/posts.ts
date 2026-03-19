export interface Post {
  id?: number;
  title: string | null;
  slug: string | null;
  created_at: Date;
  published_at: Date | null;
  updated_at: Date | null;
  category: string | null;
  content: string | null;
  is_public: boolean;
}