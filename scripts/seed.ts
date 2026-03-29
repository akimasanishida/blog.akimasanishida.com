import postgres from "postgres";
import type { Post } from "@/types/posts";
import type { User } from "@/types/users";
import bcrypt from "bcrypt";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

const posts: Post[] = [
  {
    title: "テスト記事1",
    slug: "test-post-1",
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    updated_at: null,
    category: "Test",
    content: `## テスト記事（H2見出し）

### これはH3見出しです

こんにちは、これは *テスト記事* です :smile:
~~prod用記事~~ ではないよ。

![笑顔のテスト画像](images/smile.png "素敵な笑顔")

タイトルを付けないと、キャプションなしにできます。

![笑顔のテスト画像（タイトルなし）](images/smile.png)

**テスト記事に必要な要素**

- 確認することが網羅されていること
- 短く簡潔であること

新宿駅でJRから京王に乗り換える方法：

1. ホームから **下る** 階段・エスカレーターを降りる（上ると乗り換えに時間がかかる経路になる）
2. 案内に従って、京王線の方向へ進む
3. 京王線乗り換え専用通路が見えてくるので、そこを通る
4. 乗り換え専用改札を通る

やることリスト：

- [x] ゴミ出し
- [ ] 買い物
- [ ] 洗濯

### 文学や芸術について

> 桜の樹の下には屍体したいが埋まっている！
> 
> これは信じていいことなんだよ。何故なぜって、桜の花があんなにも見事に咲くなんて信じられないことじゃないか。俺はあの美しさが信じられないので、この二三日不安だった。しかしいま、やっとわかるときが来た。桜の樹の下には屍体が埋まっている。これは信じていいことだ。
> 
> > （梶井基次郎『桜の樹の下には』より冒頭を引用）← 引用の入れ子の例

後期ロマン派の代表的な作曲家：

<dl>
  <dt>リヒャルト・ワーグナー</dt>
  <dd>オペラを派生させ、楽劇を創始、確立させた。</dd>
  <dd>代表曲は『ニーベルングの指環』など。</dd>

  <dt>アントン・ブルックナー</dt>
  <dd>重厚な交響曲や多くの宗教音楽を作曲。</dd>
  <dd>代表曲は交響曲第8番など。</dd>

  <dt>グスタフ・マーラー</dt>
  <dd>無調音楽への橋渡しとなる作曲家。作曲は交響曲と歌曲がほとんど。</dd>
  <dd>代表曲は交響曲第9番など。</dd>

  <dt>リヒャルト・シュトラウス</dt>
  <dd>交響詩やオペラ、歌曲を多く作曲。</dd>
  <dd>代表曲は交響詩『ツァラトゥストラはかく語りき』など。</dd>
</dl>

## 科学や数学について

これは [リンク](https://example.com) です。また、これは数式です:
$$
p(E(i)) = \\frac{1}{Z} \\exp(-\\beta E(i))
$$
ここで、$Z$ は
$$
Z = \\sum_{i} \\exp(-\\beta E(i))
$$
また、$\\beta$ は逆温度です（$\\beta = 1 / (k_B T)$）。

参考：<a href="https://ja.wikipedia.org/wiki/%E6%AD%A3%E6%BA%96%E9%9B%86%E5%9B%A3" target="_blank" rel="noopener noreferrer">正規集団</a> ← HTML（\`a\` タグ）を直接利用する例。

### Pythonについて

PythonでFizzBuzz問題を出力するコード例：

\`\`\`python
N = 100  # 出力する数の上限

for i in range(1, N + 1):
    if i % 3 == 0 and i % 5 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
\`\`\`

\`for\` の条件の順番が重要。

#### 出力例（H4見出し）

\`\`\`text
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
16
...
\`\`\`

## 製品管理表

| 製品型番 | <center>価格</center> | 在庫 |
| --- | --: | --- |
| HD 135344B | 10,000円 | :o: |
| HD 142527 | 15,000円 | :x: |
| PDS 70 | 12,000円 | :o: |
| HD 100546 | 8,000円 | :o: |

***

在庫がある製品は、注文可能です。価格は税込みで表示されています。

## Xの埋め込み

ポストを埋め込むとこのようになる。

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">we’re relaunching @TwitterBlue on Monday – subscribe on web for $8/month or on iOS for $11/month to get access to subscriber-only features, including the blue checkmark 🧵 <a href="https://t.co/DvvsLoSO50">pic.twitter.com/DvvsLoSO50</a></p>&mdash; X (@X) <a href="https://twitter.com/X/status/1601692766257709056?ref_src=twsrc%5Etfw">December 10, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`,
    is_public: true,
  },
  {
    title: "テスト記事2",
    slug: "test-post-2",
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      published_at: new Date(Date.now() + i * 1000 * 60).toISOString(), // 公開日時を少しずつ未来に設定
      updated_at: null,
      category: "Test",
      content: `## テスト記事${i}

      これはテスト記事${i}です。`,
      is_public: true,
    });
  }
  return posts;
}

const users: User[] = [
  {
    email: "admin@example.com",
    password: "password",
  }
];


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedPosts() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`; // UUID生成のための拡張機能を有効化
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
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

  const insertedPosts = [];
  for (const post of postsToInsert) {
    const insertedPost = await sql`
      INSERT INTO posts (title, slug, created_at, published_at, updated_at, category, content, is_public)
      VALUES (${post.title}, ${post.slug}, ${post.created_at}, ${post.published_at}, ${post.updated_at}, ${post.category}, ${post.content}, ${post.is_public})
      ON CONFLICT (slug) DO NOTHING
    `;
    insertedPosts.push(insertedPost);
    await sleep(150);
  }

  return insertedPosts;
}

async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;

  const insertedUsers = [];
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const insertedUser = await sql`
      INSERT INTO users (email, password)
      VALUES (${user.email}, ${hashedPassword})
      ON CONFLICT (email) DO NOTHING
    `;
    insertedUsers.push(insertedUser);
    await sleep(150);
  }

  return insertedUsers;
}

async function main() {
  console.log("Seeding database...");
  try {
    const result = await seedPosts();
    console.log({ message: "Database seeded successfully", result });
    const userResult = await seedUsers();
    console.log({ message: "Users seeded successfully", userResult });
  } catch (error) {
    console.error({ error });
  } finally {
    await sql.end();
  }
}

main();
