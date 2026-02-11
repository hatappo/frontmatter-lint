import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { lintFile, lintContent } from "../src/index.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

describe("lintFile", () => {
  it("should validate a valid YAML post", async () => {
    const result = await lintFile(path.join(fixturesDir, "yaml-post.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate a valid TOML post", async () => {
    const result = await lintFile(path.join(fixturesDir, "toml-post.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for invalid post", async () => {
    const result = await lintFile(path.join(fixturesDir, "invalid-post.md"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // title is missing
    expect(result.errors.some((e) => e.code === "MISSING_PROPERTY")).toBe(true);
  });

  it("should return error for non-existent file", async () => {
    const result = await lintFile(path.join(fixturesDir, "non-existent.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("FILE_NOT_FOUND");
  });
});

describe("lintContent", () => {
  it("should skip files without @schema comment", async () => {
    const content = `---
title: Hello
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });

  it("should error when requireSchema is set and schema annotation is missing", async () => {
    const content = `---
title: Hello
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir, {
      requireSchema: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_SCHEMA_ANNOTATION");
  });

  it("should pass when requireSchema is set and schema annotation is present", async () => {
    const content = `---
# @schema ./types.ts BlogPost
title: Hello
date: "2024-01-01"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir, {
      requireSchema: true,
    });
    expect(result.valid).toBe(true);
  });

  it("should report type not found error", async () => {
    const content = `---
# @schema ./types.ts NonExistentType
title: Hello
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("TYPE_NOT_FOUND");
  });

  it("should validate TOML frontmatter content", async () => {
    const content = `+++
# @schema ./types.ts BlogPost
title = "Hello"
date = "2024-01-01"
+++

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });

});

describe("Zod schema validation", () => {
  it("should validate a valid Zod schema post", async () => {
    const result = await lintFile(path.join(fixturesDir, "zod-valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report Zod validation errors", async () => {
    const result = await lintFile(path.join(fixturesDir, "zod-invalid.md"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.code === "ZOD_VALIDATION_ERROR")).toBe(
      true
    );
  });

  it("should validate with @schema directive for Zod schema in content", async () => {
    const content = `---
# @schema ./zod-schema.ts BlogPostSchema
title: "Test Post"
date: "2024-05-01"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });

  it("should report error for invalid Zod data", async () => {
    const content = `---
# @schema ./zod-schema.ts BlogPostSchema
title: 123
date: "2024-05-01"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    // Type mismatch errors from Zod are mapped to TYPE_MISMATCH
    expect(result.errors[0].code).toBe("TYPE_MISMATCH");
  });

  it("should report type not found error for non-existent export", async () => {
    const content = `---
# @schema ./zod-schema.ts NonExistentSchema
title: Hello
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    // When the export doesn't exist, it falls through to TypeScript validation
    expect(result.errors[0].code).toBe("TYPE_NOT_FOUND");
  });

  it("should validate Zod schema with TOML frontmatter", async () => {
    const content = `+++
# @schema ./zod-schema.ts BlogPostSchema
title = "Hello"
date = "2024-01-01"
+++

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });

  it("should report missing required property with property name", async () => {
    const content = `---
# @schema ./zod-schema.ts BlogPostSchema
date: "2024-01-01"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_PROPERTY");
    expect(result.errors[0].message).toContain("title");
  });

  it("should detect extra properties by default", async () => {
    const content = `---
# @schema ./zod-schema.ts BlogPostSchema
title: "Hello"
date: "2024-01-01"
extraProp: "should fail"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("EXTRA_PROPERTY");
    expect(result.errors[0].message).toContain("extraProp");
  });

  it("should allow extra properties with allowExtraProps: true", async () => {
    const content = `---
# @schema ./zod-schema.ts BlogPostSchema
title: "Hello"
date: "2024-01-01"
extraProp: "should be allowed"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir, {
      allowExtraProps: true,
    });
    expect(result.valid).toBe(true);
  });
});

describe("JSON Schema validation", () => {
  it("should validate a valid JSON Schema post", async () => {
    const result = await lintFile(path.join(fixturesDir, "jsonschema-valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report missing required property", async () => {
    const result = await lintFile(path.join(fixturesDir, "jsonschema-invalid.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_PROPERTY");
    expect(result.errors[0].message).toContain("date");
  });

  it("should report type mismatch", async () => {
    const result = await lintFile(path.join(fixturesDir, "jsonschema-type-mismatch.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("TYPE_MISMATCH");
    expect(result.errors[0].path).toBe("draft");
  });

  it("should validate with @schema directive for JSON Schema in content", async () => {
    const content = `---
# @schema ./blog-schema.json
title: "Test Post"
date: "2024-05-01"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });

  it("should report error for schema file not found", async () => {
    const content = `---
# @schema ./non-existent.json
title: "Hello"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("FILE_NOT_FOUND");
  });

  it("should detect extra properties by default", async () => {
    const content = `---
# @schema ./blog-schema.json
title: "Hello"
date: "2024-01-01"
extraProp: "should fail"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("EXTRA_PROPERTY");
    expect(result.errors[0].message).toContain("extraProp");
  });

  it("should allow extra properties with allowExtraProps: true", async () => {
    const content = `---
# @schema ./blog-schema.json
title: "Hello"
date: "2024-01-01"
extraProp: "should be allowed"
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir, {
      allowExtraProps: true,
    });
    expect(result.valid).toBe(true);
  });

  it("should validate JSON Schema with TOML frontmatter", async () => {
    const content = `+++
# @schema ./blog-schema.json
title = "Hello"
date = "2024-01-01"
+++

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
  });
});

describe("Auto-detection of schema.json", () => {
  const autoSchemaDir = path.join(fixturesDir, "auto-schema");

  it("should auto-detect schema.json in the same directory", async () => {
    const result = await lintFile(path.join(autoSchemaDir, "valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report validation errors with auto-detected schema", async () => {
    const result = await lintFile(path.join(autoSchemaDir, "invalid.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_PROPERTY");
    expect(result.errors[0].message).toContain("date");
  });

  it("should skip auto-detection when noAutoSchema is set", async () => {
    const content = `---
title: "Test"
---

Content.
`;
    const result = await lintContent(content, "test.md", autoSchemaDir, {
      noAutoSchema: true,
    });
    // Should pass because no schema is used
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should prefer explicit schema annotation over auto-detected schema", async () => {
    const content = `---
# @schema ../blog-schema.json
title: "Test"
date: "2024-01-01"
author: "John"
---

Content.
`;
    // auto-schema/schema.json doesn't have author, but blog-schema.json does
    const result = await lintContent(content, "test.md", autoSchemaDir);
    expect(result.valid).toBe(true);
  });

  it("should not auto-detect if schema.json does not exist", async () => {
    const content = `---
title: "Test"
---

Content.
`;
    // fixturesDir doesn't have schema.json (only blog-schema.json)
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("Auto-detection of schema.ts", () => {
  it("should auto-detect schema.ts with exported interface", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-interface");
    const result = await lintFile(path.join(dir, "valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report validation errors with auto-detected interface", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-interface");
    const result = await lintFile(path.join(dir, "invalid.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_PROPERTY");
    expect(result.errors[0].message).toContain("date");
  });

  it("should auto-detect schema.ts with exported type alias", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-type");
    const result = await lintFile(path.join(dir, "valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should auto-detect schema.ts with exported Zod schema", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-zod");
    const result = await lintFile(path.join(dir, "valid.md"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should error when schema.ts has multiple exports", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-multiple");
    const result = await lintFile(path.join(dir, "test.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MULTIPLE_SCHEMAS_FOUND");
    expect(result.errors[0].message).toContain("BlogPost");
    expect(result.errors[0].message).toContain("Article");
  });

  it("should error when schema.ts has no exports", async () => {
    const dir = path.join(fixturesDir, "auto-schema-ts-empty");
    const result = await lintFile(path.join(dir, "test.md"));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("NO_SCHEMA_IN_FILE");
  });

  it("should prefer schema.json over schema.ts", async () => {
    // auto-schema directory has schema.json, so it should use that
    const autoSchemaDir = path.join(fixturesDir, "auto-schema");
    const result = await lintFile(path.join(autoSchemaDir, "valid.md"));
    expect(result.valid).toBe(true);
  });
});

describe("TypeScript type validation", () => {
  it("should detect boolean type mismatch", async () => {
    const content = `---
# @schema ./types.ts BlogPost
title: "Test"
date: "2024-01-01"
draft: 9999
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("TYPE_MISMATCH");
    expect(result.errors[0].path).toBe("draft");
  });

  it("should detect array element type mismatch", async () => {
    const content = `---
# @schema ./types.ts BlogPost
title: "Test"
date: "2024-01-01"
tags:
  - valid
  - 123
---

Content.
`;
    const result = await lintContent(content, "test.md", fixturesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("TYPE_MISMATCH");
    expect(result.errors[0].path).toBe("tags");
    expect(result.errors[0].message).toContain("string[]");
  });
});
