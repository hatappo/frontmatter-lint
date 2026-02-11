# frontmatter-lint

[日本語](./README-ja.md)

A tool for validating Markdown frontmatter against TypeScript type definitions, Zod schemas, or JSON Schema.

## Features

- Validate frontmatter using TypeScript type definitions, Zod schemas, or JSON Schema
- Support for both YAML (`---`) and TOML (`+++`) frontmatter formats
- Minimal external dependencies with custom parser implementation
- Available as both CLI and editor plugins
- Auto-detection of `schema.json` and `schema.ts`

## Packages

| Package | Description | Documentation |
|---------|-------------|---------------|
| [frontmatter-lint](./packages/core) | Core library & CLI | [README](./packages/core/README.md) |
| [markdownlint-rule-frontmatter-type](./packages/markdownlint-rule) | markdownlint custom rule | [README](./packages/markdownlint-rule/README.md) |
| [remark-lint-frontmatter-type](./packages/remark-plugin) | remark-lint rule | [README](./packages/remark-plugin/README.md) |
| [textlint-rule-frontmatter-type](./packages/textlint-rule) | textlint rule | [README](./packages/textlint-rule/README.md) |

## Quick Start

### CLI

```bash
npm install -D frontmatter-lint typescript
npx fmlint "content/*.md"
```

### markdownlint plugin (VSCode compatible)

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

## Schema Specification

You can set up a schema at the directory level, and optionally override it for individual files.

### Detection Priority

1. Frontmatter comment (per-file override)
2. `schema.json` in the same directory
3. `schema.ts` in the same directory

### Directory-Level (Auto-detection)

Place `schema.json` or `schema.ts` in a directory to apply to all Markdown files in that directory.

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

Export a single type, interface, or Zod schema:

```typescript
// TypeScript type
export interface BlogPost {
  title: string;
  date: string;
  author?: string;
}
```

```typescript
// Or Zod schema
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
});
```

**Note:** `schema.ts` must export exactly one schema. If multiple exports are found, an error is reported.

### File-Level (Override)

To use a different schema for a specific file, add a `@schema` comment in the frontmatter:

```markdown
---
# @schema ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

The schema type is automatically detected based on the file extension and content:
- `.json` files are treated as JSON Schema
- `.ts` files are analyzed to determine if they export a TypeScript type or Zod schema

## CLI Options

```bash
fmlint [options] <files...>

Options:
  --allow-extra-props     Allow properties not defined in schema
  --require-schema        Require schema annotation comment
  --no-auto-schema        Disable auto-detection of schema.json/schema.ts
```

By default, properties not defined in the schema are reported as errors.

## License

MIT
