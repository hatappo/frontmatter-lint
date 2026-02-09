# frontmatter-lint

[English](./README.md)

Markdown のフロントマターを TypeScript の型定義、Zod スキーマ、または JSON Schema に基づいて検証するツール。

## 特徴

- TypeScript の型定義、Zod スキーマ、JSON Schema を使用してフロントマターを検証
- YAML (`---`) と TOML (`+++`) フロントマター形式に対応
- 外部ライブラリへの依存を最小限に抑えた自前パーサー実装
- CLI とエディタプラグインの両方で使用可能
- `schema.json` の自動検出機能

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
npx fmlint "content/**/*.md"
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

### JSON Schema

```markdown
---
# @jsonschema ./schema.json
title: "Hello World"
date: "2024-01-01"
---
```

### 自動検出

スキーマ指定コメントがない場合、同じディレクトリにある `schema.json` が自動的に使用されます。

## CLI オプション

```bash
fmlint [options] <files...>

Options:
  --allow-extra-props    スキーマに定義されていないプロパティを許可
  --require-schema       スキーマ指定コメントを必須にする
  --no-auto-schema       schema.json の自動検出を無効化
```

デフォルトでは、スキーマに定義されていないプロパティはエラーとして報告されます。

## ライセンス

MIT
