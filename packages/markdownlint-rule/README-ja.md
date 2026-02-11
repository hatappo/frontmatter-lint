# markdownlint-rule-frontmatter-type

[English](./README.md)

[markdownlint](https://github.com/DavidAnson/markdownlint) のカスタムルールとして、フロントマターを TypeScript の型定義、Zod スキーマ、または JSON Schema に基づいて検証します。

VSCode の [markdownlint 拡張機能](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) と連携して、エディタ上でリアルタイムにフロントマターを検証できます。

## インストール

```bash
npm install -D markdownlint-rule-frontmatter-type markdownlint-cli2 typescript
```

## セットアップ

プロジェクトルートに `.markdownlint-cli2.jsonc` を作成：

```jsonc
{
  "customRules": ["markdownlint-rule-frontmatter-type"],
  "config": {
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

特定のファイルで異なるスキーマを使用する場合、フロントマター内に `@schema` コメントで指定します：

```markdown
---
# @schema ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

スキーマの種類はファイル拡張子と内容に基づいて自動的に判別されます：
- `.json` ファイルは JSON Schema として扱われます
- `.ts` ファイルは TypeScript 型か Zod スキーマかを解析して判別します

## CLI での実行

```bash
npx markdownlint-cli2 "content/**/*.md"
```

出力例：

```
content/posts/draft.md:1 frontmatter-type/fml001 [必須プロパティ 'title' がありません]

markdownlint-cli2 v0.20.0 (markdownlint v0.40.0)
Linting: 2 file(s)
Summary: 1 error(s)
```

## VSCode での使用

1. [vscode-markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) 拡張機能をインストール
2. `.markdownlint-cli2.jsonc` をプロジェクトルートに配置
3. Markdown ファイルを開くと、フロントマターのエラーが Problems パネルに表示される

## ルール設定

`.markdownlint-cli2.jsonc` でオプションを設定できます：

```jsonc
{
  "customRules": ["markdownlint-rule-frontmatter-type"],
  "config": {
    "frontmatter-type": {
      "allowExtraProps": true,
      "requireSchema": true,
      "noAutoSchema": true
    }
  }
}
```

### オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `allowExtraProps` | `boolean` | `false` | スキーマに定義されていないプロパティを許可 |
| `requireSchema` | `boolean` | `false` | スキーマ指定コメントがないファイルをエラーとして報告 |
| `noAutoSchema` | `boolean` | `false` | `schema.json`/`schema.ts` の自動検出を無効化 |

## ルール情報

| 項目 | 値 |
|------|-----|
| Rule names | `frontmatter-type`, `fml001` |
| Tags | `frontmatter`, `typescript` |

## 対応フロントマター形式

- YAML (`---`)
- TOML (`+++`)

## ライセンス

MIT
