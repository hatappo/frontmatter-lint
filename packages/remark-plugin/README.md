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

### JSON Schema

```markdown
---
# @jsonschema ./schema.json
title: "Hello World"
date: "2024-01-01"
---
```

### Auto-detection

If no schema annotation is present, `schema.json` in the same directory will be automatically used if it exists.

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
| `noAutoSchema` | `boolean` | `false` | Disable auto-detection of `schema.json` in the same directory |

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
