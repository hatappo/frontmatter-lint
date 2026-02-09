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
