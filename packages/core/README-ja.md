# frontmatter-lint

[English](./README.md)

Markdown のフロントマターを TypeScript の型定義または Zod スキーマに基づいて検証する CLI ツール。

## インストール

```bash
npm install -D frontmatter-lint typescript
```

Zod スキーマ検証を使用する場合：

```bash
npm install -D frontmatter-lint typescript zod
```

## 型定義の指定方法

フロントマター内にコメントで型を指定します：

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

型定義ファイル (`types.ts`):

```typescript
export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
}
```

### Zod スキーマの使用

```markdown
---
# @zod ./schema.ts BlogPostSchema
title: "Hello World"
date: "2024-01-01"
---
```

スキーマファイル (`schema.ts`):

```typescript
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

### JSON Schema の使用

```markdown
---
# @jsonschema ./schema.json
title: "Hello World"
date: "2024-01-01"
---
```

スキーマファイル (`schema.json`):

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

## 基本的な使用方法

```bash
# 単一ファイル
npx fmlint article.md

# 複数ファイル（glob パターン）
npx fmlint "content/**/*.md"
```

## オプション

| オプション | 説明 |
|-----------|------|
| `--allow-extra-props` | スキーマに定義されていないプロパティを許可 |
| `--require-schema` | スキーマ指定コメントがないファイルをエラーとして報告 |
| `--no-auto-schema` | `schema.json`/`schema.ts` の自動検出を無効化 |

### 使用例

```bash
# 基本的な使い方（デフォルトで余分なプロパティはエラー）
npx fmlint "content/**/*.md"

# 余分なプロパティを許可
npx fmlint --allow-extra-props "content/**/*.md"

# スキーマ指定を必須にする
npx fmlint --require-schema "content/**/*.md"

# schema.json/schema.ts の自動検出を無効化
npx fmlint --no-auto-schema "content/**/*.md"
```

### 自動検出

スキーマ指定コメントがない場合、同ディレクトリのスキーマが自動検出されます：

1. `schema.json` - JSON Schema として使用
2. `schema.ts` - export された単一の type/interface または Zod スキーマを使用

**注意:** `schema.ts` は1つのスキーマのみを export する必要があります。

## 出力例

```
✓ content/posts/hello.md
✗ content/posts/draft.md
  - 必須プロパティ 'title' がありません
  - プロパティ 'date' の型が一致しません (expected: string, actual: number)

合計: 2 ファイル, 成功: 1, 失敗: 1
```

## 対応フロントマター形式

### YAML (デフォルト)

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
tags:
  - typescript
  - markdown
---
```

### TOML

```markdown
+++
# @type ./types.ts BlogPost
title = "Hello World"
date = "2024-01-01"
tags = ["typescript", "markdown"]
+++
```

## プログラムからの使用

```typescript
import { lintFile, lintContent } from "frontmatter-lint";

// ファイルを検証
const result = await lintFile("article.md", {
  strictProperties: true,
});

if (!result.valid) {
  for (const error of result.errors) {
    console.log(`${error.code}: ${error.message}`);
  }
}

// コンテンツを直接検証
const content = `---
# @type ./types.ts BlogPost
title: "Hello"
---`;

const result2 = await lintContent(content, "article.md", process.cwd());
```

## エラーコード

| コード | 説明 |
|--------|------|
| `MISSING_PROPERTY` | 必須プロパティがありません |
| `TYPE_MISMATCH` | プロパティの型が一致しません |
| `EXTRA_PROPERTY` | 型定義にないプロパティがあります（strictモード） |
| `INVALID_FRONTMATTER` | フロントマターの構文が不正です |
| `TYPE_NOT_FOUND` | 指定された型が見つかりません |
| `FILE_NOT_FOUND` | 型定義ファイルが見つかりません |
| `SCHEMA_NOT_FOUND` | 指定された Zod スキーマが見つかりません |
| `MISSING_SCHEMA_ANNOTATION` | スキーマ指定コメントがありません（requireSchemaモード） |
| `ZOD_VALIDATION_ERROR` | Zod スキーマ検証エラー |

## ライセンス

MIT
