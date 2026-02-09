# frontmatter-lint

[日本語](./README-ja.md)

A tool for validating Markdown frontmatter against TypeScript type definitions, Zod schemas, or JSON Schema.

## Features

- Validate frontmatter using TypeScript type definitions, Zod schemas, or JSON Schema
- Support for both YAML (`---`) and TOML (`+++`) frontmatter formats
- Minimal external dependencies with custom parser implementation
- Available as both CLI and editor plugins
- Auto-detection of `schema.json`

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
npx fmlint "content/**/*.md"
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

## Specifying Type Definitions

Specify the type using a comment in the frontmatter:

### TypeScript Type

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

### Zod Schema

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
    "author": { "type": "string" }
  },
  "required": ["title", "date"]
}
```

### Auto-detection

If no schema annotation is present, schemas in the same directory are automatically detected in the following order:

1. `schema.json` - Used as JSON Schema
2. `schema.ts` - Uses the single exported type/interface or Zod schema

**Note:** `schema.ts` must export exactly one schema. If multiple exports are found, an error is reported.

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
