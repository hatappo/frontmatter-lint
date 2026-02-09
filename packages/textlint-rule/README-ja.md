# textlint-rule-frontmatter-type

[English](./README.md)

[textlint](https://github.com/textlint/textlint) のルールとして、フロントマターを TypeScript の型定義、Zod スキーマ、または JSON Schema に基づいて検証します。

## インストール

```bash
npm install -D textlint-rule-frontmatter-type textlint typescript
```

## セットアップ

プロジェクトルートに `.textlintrc.json` を作成：

```json
{
  "rules": {
    "frontmatter-type": true
  }
}
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
npx textlint "content/**/*.md"
```

出力例：

```
content/posts/draft.md
  1:1  error  必須プロパティ 'title' がありません  frontmatter-type

✖ 1 problem (1 error, 0 warnings)
```

## VSCode での使用

1. [vscode-textlint](https://marketplace.visualstudio.com/items?itemName=taichi.vscode-textlint) 拡張機能をインストール
2. `.textlintrc.json` をプロジェクトルートに配置
3. Markdown ファイルを開くと、フロントマターのエラーが Problems パネルに表示される

## オプション

`.textlintrc.json` でオプションを設定できます：

```json
{
  "rules": {
    "frontmatter-type": {
      "allowExtraProps": true,
      "requireSchema": true,
      "noAutoSchema": true
    }
  }
}
```

### オプション一覧

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `allowExtraProps` | `boolean` | `false` | スキーマに定義されていないプロパティを許可 |
| `requireSchema` | `boolean` | `false` | スキーマ指定コメントがないファイルをエラーとして報告 |
| `noAutoSchema` | `boolean` | `false` | `schema.json`/`schema.ts` の自動検出を無効化 |

## 対応フロントマター形式

- YAML (`---`)
- TOML (`+++`)

## ライセンス

MIT
