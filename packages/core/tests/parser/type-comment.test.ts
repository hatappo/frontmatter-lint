import { describe, it, expect } from "vitest";
import { parseTypeComment } from "../../src/parser/type-comment.js";

describe("parseTypeComment", () => {
  describe("@type (TypeScript)", () => {
    it("should parse valid type comment", () => {
      const result = parseTypeComment("# @type ./types.ts BlogPost");
      expect(result).toEqual({
        kind: "typescript",
        filePath: "./types.ts",
        typeName: "BlogPost",
      });
    });

    it("should parse type comment with relative path", () => {
      const result = parseTypeComment("# @type ../schemas/blog.ts Post");
      expect(result).toEqual({
        kind: "typescript",
        filePath: "../schemas/blog.ts",
        typeName: "Post",
      });
    });

    it("should handle extra whitespace", () => {
      const result = parseTypeComment("#   @type   ./types.ts   MyType  ");
      expect(result).toEqual({
        kind: "typescript",
        filePath: "./types.ts",
        typeName: "MyType",
      });
    });
  });

  describe("@zod (Zod schema)", () => {
    it("should parse valid zod comment", () => {
      const result = parseTypeComment("# @zod ./schema.ts BlogPostSchema");
      expect(result).toEqual({
        kind: "zod",
        filePath: "./schema.ts",
        typeName: "BlogPostSchema",
      });
    });

    it("should parse zod comment with relative path", () => {
      const result = parseTypeComment("# @zod ../schemas/blog.ts PostSchema");
      expect(result).toEqual({
        kind: "zod",
        filePath: "../schemas/blog.ts",
        typeName: "PostSchema",
      });
    });

    it("should handle extra whitespace for zod", () => {
      const result = parseTypeComment("#   @zod   ./schema.ts   MySchema  ");
      expect(result).toEqual({
        kind: "zod",
        filePath: "./schema.ts",
        typeName: "MySchema",
      });
    });
  });

  describe("@jsonschema (JSON Schema)", () => {
    it("should parse valid jsonschema comment", () => {
      const result = parseTypeComment("# @jsonschema ./schema.json");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "./schema.json",
        typeName: "",
      });
    });

    it("should parse jsonschema comment with relative path", () => {
      const result = parseTypeComment("# @jsonschema ../schemas/blog.schema.json");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "../schemas/blog.schema.json",
        typeName: "",
      });
    });

    it("should handle extra whitespace for jsonschema", () => {
      const result = parseTypeComment("#   @jsonschema   ./schema.json  ");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "./schema.json",
        typeName: "",
      });
    });
  });

  describe("invalid comments", () => {
    it("should return null for non-type comments", () => {
      expect(parseTypeComment("# This is a regular comment")).toBeNull();
      expect(parseTypeComment("title: Hello")).toBeNull();
      expect(parseTypeComment("")).toBeNull();
    });

    it("should return null for incomplete type comments", () => {
      expect(parseTypeComment("# @type")).toBeNull();
      expect(parseTypeComment("# @type ./types.ts")).toBeNull();
      expect(parseTypeComment("# @zod")).toBeNull();
      expect(parseTypeComment("# @zod ./schema.ts")).toBeNull();
      expect(parseTypeComment("# @jsonschema")).toBeNull();
    });
  });
});
