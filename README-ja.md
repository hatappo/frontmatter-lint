# frontmatter-lint

[English](./README.md)

Markdown のフロントマターを TypeScript の型定義、Zod スキーマ、または JSON Schema に基づいて検証するツール。

## 特徴

- TypeScript の型定義、Zod スキーマ、JSON Schema を使用してフロントマターを検証
- YAML (`---`) と TOML (`+++`) フロントマター形式に対応
- 外部ライブラリへの依存を最小限に抑えた自前パーサー実装
- CLI とエディタプラグインの両方で使用可能
- `schema.json` / `schema.ts` の自動検出機能

## パッケージ

| パッケージ | 説明 | ドキュメント |
|-----------|------|-------------|
| [frontmatter-lint](./packages/core) | コアライブラリ & CLI | [README](./packages/core/README-ja.md) |
| [markdownlint-rule-frontmatter-type](./packages/markdownlint-rule) | markdownlint カスタムルール | [README](./packages/markdownlint-rule/README-ja.md) |
| [remark-lint-frontmatter-type](./packages/remark-plugin) | remark-lint ルール | [README](./packages/remark-plugin/README-ja.md) |
| [textlint-rule-frontmatter-type](./packages/textlint-rule) | textlint ルール | [README](./packages/textlint-rule/README-ja.md) |

## クイックスタート

### CLI

```bash
npm install -D frontmatter-lint typescript
npx fmlint "content/*.md"
```

### markdownlint プラグイン (VSCode 対応)

```bash
npm install -D markdownlint-rule-frontmatter-type markdownlint-cli2 typescript
```

`.markdownlint-cli2.jsonc`:
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
    "author": { "type": "string" }
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
}
```

```typescript
// または Zod スキーマ
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
});
```

**注意:** `schema.ts` は1つのスキーマのみを export する必要があります。複数の export がある場合はエラーになります。

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

## CLI オプション

```bash
fmlint [options] <files...>

Options:
  --allow-extra-props    スキーマに定義されていないプロパティを許可
  --require-schema       スキーマ指定コメントを必須にする
  --no-auto-schema       schema.json/schema.ts の自動検出を無効化
```

デフォルトでは、スキーマに定義されていないプロパティはエラーとして報告されます。

## ライセンス

MIT
