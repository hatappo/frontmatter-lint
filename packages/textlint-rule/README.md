# textlint-rule-frontmatter-type

[日本語](./README-ja.md)

A [textlint](https://github.com/textlint/textlint) rule that validates frontmatter against TypeScript type definitions, Zod schemas, or JSON Schema.

## Installation

```bash
npm install -D textlint-rule-frontmatter-type textlint typescript
```

## Setup

Create `.textlintrc.json` in your project root:

```json
{
  "rules": {
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
  tags?: string[];
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

### Auto-detection

If no schema annotation is present, schemas in the same directory are automatically detected:

1. `schema.json` - Used as JSON Schema
2. `schema.ts` - Uses the single exported type/interface or Zod schema

**Note:** `schema.ts` must export exactly one schema.

## CLI Usage

```bash
npx textlint "content/**/*.md"
```

Output example:

```
content/posts/draft.md
  1:1  error  Required property 'title' is missing  frontmatter-type

✖ 1 problem (1 error, 0 warnings)
```

## VSCode Usage

1. Install the [vscode-textlint](https://marketplace.visualstudio.com/items?itemName=taichi.vscode-textlint) extension
2. Place `.textlintrc.json` in your project root
3. Open a Markdown file and frontmatter errors will appear in the Problems panel

## Options

Configure options in `.textlintrc.json`:

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

### Options List

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowExtraProps` | `boolean` | `false` | Allow properties not defined in the schema |
| `requireSchema` | `boolean` | `false` | Report files without schema annotation as errors |
| `noAutoSchema` | `boolean` | `false` | Disable auto-detection of `schema.json`/`schema.ts` |

## Supported Frontmatter Formats

- YAML (`---`)
- TOML (`+++`)

## License

MIT
