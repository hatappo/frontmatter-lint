# frontmatter-lint

[日本語](./README-ja.md)

A CLI tool for validating Markdown frontmatter against TypeScript type definitions or Zod schemas.

## Installation

```bash
npm install -D frontmatter-lint typescript
```

For Zod schema validation:

```bash
npm install -D frontmatter-lint typescript zod
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

## Basic Usage

```bash
# Single file
npx fmlint article.md

# Multiple files (glob pattern)
npx fmlint "content/*.md"
```

## Options

| Option | Description |
|--------|-------------|
| `--allow-extra-props` | Allow properties not defined in schema |
| `--require-schema` | Report files without schema annotation as errors |
| `--no-auto-schema` | Disable auto-detection of `schema.json`/`schema.ts` |

### Usage Examples

```bash
# Basic usage (extra properties are errors by default)
npx fmlint "content/*.md"

# Allow extra properties
npx fmlint --allow-extra-props "content/*.md"

# Require schema annotation
npx fmlint --require-schema "content/*.md"

# Disable auto-detection of schema.json/schema.ts
npx fmlint --no-auto-schema "content/*.md"
```

## Output Example

```
✓ content/posts/hello.md
✗ content/posts/draft.md
  - Required property 'title' is missing
  - Property 'date' type mismatch (expected: string, actual: number)

Total: 2 files, Passed: 1, Failed: 1
```

## Supported Frontmatter Formats

### YAML (default)

```markdown
---
# @type ./types.ts BlogPost
title: "Hello World"
date: "2024-01-01"
tags:
  - typescript
  - markdown
---
```

### TOML

```markdown
+++
# @type ./types.ts BlogPost
title = "Hello World"
date = "2024-01-01"
tags = ["typescript", "markdown"]
+++
```

## Programmatic Usage

```typescript
import { lintFile, lintContent } from "frontmatter-lint";

// Validate a file
const result = await lintFile("article.md", {
  strictProperties: true,
});

if (!result.valid) {
  for (const error of result.errors) {
    console.log(`${error.code}: ${error.message}`);
  }
}

// Validate content directly
const content = `---
# @type ./types.ts BlogPost
title: "Hello"
---`;

const result2 = await lintContent(content, "article.md", process.cwd());
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_PROPERTY` | Required property is missing |
| `TYPE_MISMATCH` | Property type does not match |
| `EXTRA_PROPERTY` | Property not defined in type (strict mode) |
| `INVALID_FRONTMATTER` | Invalid frontmatter syntax |
| `TYPE_NOT_FOUND` | Specified type not found |
| `FILE_NOT_FOUND` | Type definition file not found |
| `SCHEMA_NOT_FOUND` | Specified Zod schema not found |
| `MISSING_SCHEMA_ANNOTATION` | Schema annotation missing (requireSchema mode) |
| `ZOD_VALIDATION_ERROR` | Zod schema validation error |

## License

MIT
