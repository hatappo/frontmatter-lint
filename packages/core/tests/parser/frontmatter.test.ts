import { describe, it, expect } from "vitest";
import { extractFrontmatter } from "../../src/parser/frontmatter.js";

describe("extractFrontmatter", () => {
  it("should extract frontmatter from markdown", () => {
    const content = `---
title: Hello World
date: 2024-01-01
---

# Hello World

Content here.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual({
      title: "Hello World",
      date: "2024-01-01",
    });
  });

  it("should extract type reference", () => {
    const content = `---
# @schema ./types.ts BlogPost
title: Hello
---

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.typeRef).toEqual({
      kind: "auto",
      filePath: "./types.ts",
      typeName: "BlogPost",
    });
    expect(result!.data).toEqual({
      title: "Hello",
    });
  });

  it("should return null for content without frontmatter", () => {
    const content = `# Hello World

No frontmatter here.
`;
    const result = extractFrontmatter(content);
    expect(result).toBeNull();
  });

  it("should handle empty frontmatter", () => {
    const content = `---
---

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual({});
  });

  it("should parse complex frontmatter", () => {
    const content = `---
# @schema ./types.ts BlogPost
title: "My Post"
tags:
  - tech
  - programming
author:
  name: John
  email: john@example.com
---

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual({
      title: "My Post",
      tags: ["tech", "programming"],
      author: {
        name: "John",
        email: "john@example.com",
      },
    });
  });

  it("should detect YAML format with ---", () => {
    const content = `---
title: Hello
---

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("yaml");
  });

  it("should extract TOML frontmatter with +++", () => {
    const content = `+++
title = "Hello World"
date = "2024-01-01"
+++

# Hello World

Content here.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("toml");
    expect(result!.data).toEqual({
      title: "Hello World",
      date: "2024-01-01",
    });
  });

  it("should extract type reference from TOML", () => {
    const content = `+++
# @schema ./types.ts BlogPost
title = "Hello"
+++

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("toml");
    expect(result!.typeRef).toEqual({
      kind: "auto",
      filePath: "./types.ts",
      typeName: "BlogPost",
    });
    expect(result!.data).toEqual({
      title: "Hello",
    });
  });

  it("should parse complex TOML frontmatter", () => {
    const content = `+++
# @schema ./types.ts BlogPost
title = "My Post"
tags = ["tech", "programming"]

[author]
name = "John"
email = "john@example.com"
+++

Content.
`;
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("toml");
    expect(result!.data).toEqual({
      title: "My Post",
      tags: ["tech", "programming"],
      author: {
        name: "John",
        email: "john@example.com",
      },
    });
  });
});
