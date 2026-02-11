import { describe, it, expect } from "vitest";
import { parseTypeComment } from "../../src/parser/type-comment.js";

describe("parseTypeComment", () => {
  describe("@schema with .ts files", () => {
    it("should parse schema comment with type name", () => {
      const result = parseTypeComment("# @schema ./types.ts BlogPost");
      expect(result).toEqual({
        kind: "auto",
        filePath: "./types.ts",
        typeName: "BlogPost",
      });
    });

    it("should parse schema comment with relative path", () => {
      const result = parseTypeComment("# @schema ../schemas/blog.ts Post");
      expect(result).toEqual({
        kind: "auto",
        filePath: "../schemas/blog.ts",
        typeName: "Post",
      });
    });

    it("should parse schema comment without type name", () => {
      const result = parseTypeComment("# @schema ./schema.ts");
      expect(result).toEqual({
        kind: "auto",
        filePath: "./schema.ts",
        typeName: "",
      });
    });

    it("should handle extra whitespace", () => {
      const result = parseTypeComment("#   @schema   ./types.ts   MyType  ");
      expect(result).toEqual({
        kind: "auto",
        filePath: "./types.ts",
        typeName: "MyType",
      });
    });
  });

  describe("@schema with .json files", () => {
    it("should parse jsonschema comment", () => {
      const result = parseTypeComment("# @schema ./schema.json");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "./schema.json",
        typeName: "",
      });
    });

    it("should parse jsonschema comment with relative path", () => {
      const result = parseTypeComment("# @schema ../schemas/blog.schema.json");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "../schemas/blog.schema.json",
        typeName: "",
      });
    });

    it("should handle extra whitespace for jsonschema", () => {
      const result = parseTypeComment("#   @schema   ./schema.json  ");
      expect(result).toEqual({
        kind: "jsonschema",
        filePath: "./schema.json",
        typeName: "",
      });
    });
  });

  describe("invalid comments", () => {
    it("should return null for non-schema comments", () => {
      expect(parseTypeComment("# This is a regular comment")).toBeNull();
      expect(parseTypeComment("title: Hello")).toBeNull();
      expect(parseTypeComment("")).toBeNull();
    });

    it("should return null for incomplete schema comments", () => {
      expect(parseTypeComment("# @schema")).toBeNull();
    });

    it("should return null for unsupported file extensions", () => {
      expect(parseTypeComment("# @schema ./schema.yaml")).toBeNull();
      expect(parseTypeComment("# @schema ./schema.js")).toBeNull();
    });
  });
});
