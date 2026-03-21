import postgres from "postgres";
import type { Post } from "@/types/posts";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

const posts: Post[] = [
  {
    title: "テスト記事1",
    slug: "test-post-1",
    created_at: new Date(),
    published_at: new Date(),
    updated_at: null,
    category: "Test",
    content: `## あいさつ

こんにちは、これはテスト記事です。

**テストアイテム**

- アイテム1
- アイテム2
- アイテム3

[リンク](https://example.com) です。また、これは数式です:

$$
p(E(i)) = \\frac{1}{Z} \\exp(-\\beta E(i))
$$
ここで、Zは
$$
Z = \\sum_{i} \\exp(-\\beta E(i))
$$
また、$\\beta$は逆温度です（$\\beta = 1 / (k_B T)$）。

参考：<a href="https://ja.wikipedia.org/wiki/%E6%AD%A3%E6%BA%96%E9%9B%86%E5%9B%A3" target="_blank" rel="noopener noreferrer">正規集団</a> ← HTML（\`a\` タグ）を直接利用する例。`,
    is_public: true,
  },
  {
    title: "テスト記事2",
    slug: "test-post-2",
    created_at: new Date(),
    published_at: new Date(),
    updated_at: new Date(),
    category: "Test",
    content: `## これは別のテスト記事です

**内容の例**

1. 項目A
2. 項目B
3. 項目C

> これは引用です。

\`\`\`javascript
console.log("Hello, world!");
\`\`\`
`,
    is_public: true,
  },
  {
    title: "テストの下書き記事",
    slug: "test-draft-post",
    created_at: new Date(),
    published_at: null,
    updated_at: null,
    category: "Test",
    content: `## これは下書き記事です

      この内容はまだ公開されていません。`,
    is_public: false,
  },
];

function appendSpamPosts(posts: Post[]): Post[] {
  for (let i = 3; i <= 30; i++) {
    posts.push({
      title: `テスト記事${i}`,
      slug: `test-post-${i}`,
      created_at: new Date(),
      published_at: new Date(Date.now() + i * 1000 * 60), // 公開日時を少しずつ未来に設定
      updated_at: null,
      category: "Test",
      content: `## テスト記事${i}

      これはテスト記事${i}です。`,
      is_public: true,
    });
  }
  return posts;
}

async function seedPosts() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`; // UUID生成のための拡張機能を有効化
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      published_at TIMESTAMP,
      updated_at TIMESTAMP,
      category VARCHAR(100),
      content TEXT,
      is_public BOOLEAN NOT NULL DEFAULT false
    );
  `;

  // インデックスを作成
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_public_and_published_at ON posts(is_public, published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`;

  const postsToInsert = appendSpamPosts(posts);

  const insertedPosts = await Promise.all(
    postsToInsert.map(
      (post) => sql`
        INSERT INTO posts (title, slug, created_at, published_at, updated_at, category, content, is_public)
        VALUES (${post.title}, ${post.slug}, ${post.created_at}, ${post.published_at}, ${post.updated_at}, ${post.category}, ${post.content}, ${post.is_public})
        ON CONFLICT (slug) DO NOTHING
        RETURNING id;
      `,
    ),
  );

  return insertedPosts;
}

async function main() {
  console.log("Seeding database...");
  try {
    const result = await seedPosts();
    console.log({ message: "Database seeded successfully", result });
  } catch (error) {
    console.error({ error });
  } finally {
    await sql.end();
  }
}

main();
