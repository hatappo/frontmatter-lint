# remark-lint-frontmatter-type

[English](./README.md)

[remark-lint](https://github.com/remarkjs/remark-lint) のルールとして、フロントマターを TypeScript の型定義、Zod スキーマ、または JSON Schema に基づいて検証します。

## インストール

```bash
npm install -D remark-lint-frontmatter-type remark remark-frontmatter remark-cli typescript
```

## セットアップ

プロジェクトルートに `.remarkrc.mjs` を作成：

```javascript
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

export default {
  plugins: [remarkFrontmatter, remarkLintFrontmatterType],
};
```

## スキーマの指定方法

ディレクトリ単位でスキーマを設定し、必要に応じて個別ファイルで上書きできます。

### 検出の優先順位

1. フロントマター内のコメント指定（個別上書き）
2. 同ディレクトリの `schema.json`
3. 同ディレクトリの `schema.ts`

### ディレクトリ単位での指定（自動検出）

同ディレクトリに `schema.json` または `schema.ts` を配置すると、そのディレクトリ内の全 Markdown ファイルに適用されます。

#### schema.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "date": { "type": "string" },
    "author": { "type": "string" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["title", "date"]
}
```

#### schema.ts

単一の type、interface、または Zod スキーマを export します：

```typescript
// TypeScript 型
export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
}
```

```typescript
// または Zod スキーマ
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

**注意:** `schema.ts` は1つのスキーマのみを export する必要があります。

### ファイル単位での指定（上書き）

特定のファイルで異なるスキーマを使用する場合、フロントマター内にコメントで指定します：

#### TypeScript 型

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

#### Zod スキーマ

```markdown
---
# @zod ./schema.ts BlogPostSchema
title: "Hello World"
date: "2024-01-01"
---
```

#### JSON Schema

```markdown
---
# @jsonschema ./schema.json
title: "Hello World"
date: "2024-01-01"
---
```

## CLI での実行

```bash
npx remark . --frail
```

出力例：

```
content/posts/draft.md
1:1 warning 必須プロパティ 'title' がありません frontmatter-type remark-lint

⚠ 1 warning
```

## オプション

`.remarkrc.mjs` でオプションを設定できます：

```javascript
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

export default {
  plugins: [
    remarkFrontmatter,
    [
      remarkLintFrontmatterType,
      {
        allowExtraProps: true,
        requireSchema: true,
        noAutoSchema: true,
      },
    ],
  ],
};
```

### オプション一覧

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `allowExtraProps` | `boolean` | `false` | スキーマに定義されていないプロパティを許可 |
| `requireSchema` | `boolean` | `false` | スキーマ指定コメントがないファイルをエラーとして報告 |
| `noAutoSchema` | `boolean` | `false` | `schema.json`/`schema.ts` の自動検出を無効化 |

## プログラムからの使用

```javascript
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

const file = await remark()
  .use(remarkFrontmatter)
  .use(remarkLintFrontmatterType)
  .process({
    value: content,
    path: filePath,
    cwd: process.cwd(),
  });

console.log(file.messages);
```

## 対応フロントマター形式

- YAML (`---`)
- TOML (`+++`)

## ライセンス

MIT
