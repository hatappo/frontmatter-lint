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
| `noAutoSchema` | `boolean` | `false` | Disable auto-detection of `schema.json` in the same directory |

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
