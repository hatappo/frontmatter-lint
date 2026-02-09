# markdownlint-rule-frontmatter-type

[日本語](./README-ja.md)

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule that validates frontmatter against TypeScript type definitions, Zod schemas, or JSON Schema.

Works with the [markdownlint VSCode extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) to provide real-time frontmatter validation in your editor.

## Installation

```bash
npm install -D markdownlint-rule-frontmatter-type markdownlint-cli2 typescript
```

## Setup

Create `.markdownlint-cli2.jsonc` in your project root:

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

Export a single type, interface, or Zod schema:

```typescript
// TypeScript type
export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
}
```

```typescript
// Or Zod schema
import { z } from "zod";

export const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

**Note:** `schema.ts` must export exactly one schema.

### File-Level (Override)

To use a different schema for a specific file, add a comment in the frontmatter:

#### TypeScript Type

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
---
```

#### Zod Schema

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

## CLI Usage

```bash
npx markdownlint-cli2 "content/**/*.md"
```

Output example:

```
content/posts/draft.md:1 frontmatter-type/fml001 [Required property 'title' is missing]

markdownlint-cli2 v0.20.0 (markdownlint v0.40.0)
Linting: 2 file(s)
Summary: 1 error(s)
```

## VSCode Usage

1. Install the [vscode-markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) extension
2. Place `.markdownlint-cli2.jsonc` in your project root
3. Open a Markdown file and frontmatter errors will appear in the Problems panel

## Rule Configuration

Configure options in `.markdownlint-cli2.jsonc`:

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

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowExtraProps` | `boolean` | `false` | Allow properties not defined in the schema |
| `requireSchema` | `boolean` | `false` | Report files without schema annotation as errors |
| `noAutoSchema` | `boolean` | `false` | Disable auto-detection of `schema.json`/`schema.ts` |

## Rule Information

| Item | Value |
|------|-------|
| Rule names | `frontmatter-type`, `fml001` |
| Tags | `frontmatter`, `typescript` |

## Supported Frontmatter Formats

- YAML (`---`)
- TOML (`+++`)

## License

MIT
