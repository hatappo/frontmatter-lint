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

## 型定義の指定方法

フロントマター内にコメントで型を指定します：

### TypeScript 型定義

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

```typescript
// types.ts
export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
}
```

### Zod スキーマ

```markdown
---
# @zod ./schema.ts BlogPostSchema
title: "Hello World"
date: "2024-01-01"
---
```

```typescript
// schema.ts
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

### JSON Schema

```markdown
---
# @jsonschema ./schema.json
title: "Hello World"
date: "2024-01-01"
---
```

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

### 自動検出

スキーマ指定コメントがない場合、同ディレクトリのスキーマが自動検出されます：

1. `schema.json` - JSON Schema として使用
2. `schema.ts` - export された単一の type/interface または Zod スキーマを使用

**注意:** `schema.ts` は1つのスキーマのみを export する必要があります。

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
