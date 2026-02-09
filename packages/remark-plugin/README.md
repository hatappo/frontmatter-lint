# remark-lint-frontmatter-type

[日本語](./README-ja.md)

A [remark-lint](https://github.com/remarkjs/remark-lint) rule that validates frontmatter against TypeScript type definitions, Zod schemas, or JSON Schema.

## Installation

```bash
npm install -D remark-lint-frontmatter-type remark remark-frontmatter remark-cli typescript
```

## Setup

Create `.remarkrc.mjs` in your project root:

```javascript
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

export default {
  plugins: [remarkFrontmatter, remarkLintFrontmatterType],
};
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
npx remark . --frail
```

Output example:

```
content/posts/draft.md
1:1 warning Required property 'title' is missing frontmatter-type remark-lint

⚠ 1 warning
```

## Options

Configure options in `.remarkrc.mjs`:

```javascript
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

export default {
  plugins: [
    remarkFrontmatter,
    [
      remarkLintFrontmatterType,
      {
        allowExtraProps: true,
        requireSchema: true,
        noAutoSchema: true,
      },
    ],
  ],
};
```

### Options List

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowExtraProps` | `boolean` | `false` | Allow properties not defined in the schema |
| `requireSchema` | `boolean` | `false` | Report files without schema annotation as errors |
| `noAutoSchema` | `boolean` | `false` | Disable auto-detection of `schema.json`/`schema.ts` |

## Programmatic Usage

```javascript
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "remark-lint-frontmatter-type";

const file = await remark()
  .use(remarkFrontmatter)
  .use(remarkLintFrontmatterType)
  .process({
    value: content,
    path: filePath,
    cwd: process.cwd(),
  });

console.log(file.messages);
```

## Supported Frontmatter Formats

- YAML (`---`)
- TOML (`+++`)

## License

MIT
