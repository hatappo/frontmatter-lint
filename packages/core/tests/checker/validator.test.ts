import { describe, it, expect } from "vitest";
import { validate } from "../../src/checker/validator.js";
import type { TypeInfo } from "../../src/types.js";

describe("validate", () => {
  describe("primitive types", () => {
    it("should validate string", () => {
      const typeInfo: TypeInfo = { kind: "string" };
      expect(validate("hello", typeInfo)).toEqual([]);
      expect(validate(123, typeInfo)).toHaveLength(1);
      expect(validate(123, typeInfo)[0].code).toBe("TYPE_MISMATCH");
    });

    it("should validate number", () => {
      const typeInfo: TypeInfo = { kind: "number" };
      expect(validate(42, typeInfo)).toEqual([]);
      expect(validate("42", typeInfo)).toHaveLength(1);
    });

    it("should validate boolean", () => {
      const typeInfo: TypeInfo = { kind: "boolean" };
      expect(validate(true, typeInfo)).toEqual([]);
      expect(validate(false, typeInfo)).toEqual([]);
      expect(validate("true", typeInfo)).toHaveLength(1);
    });

    it("should validate null", () => {
      const typeInfo: TypeInfo = { kind: "null" };
      expect(validate(null, typeInfo)).toEqual([]);
      expect(validate(undefined, typeInfo)).toHaveLength(1);
    });
  });

  describe("literal types", () => {
    it("should validate string literal", () => {
      const typeInfo: TypeInfo = { kind: "literal", value: "draft" };
      expect(validate("draft", typeInfo)).toEqual([]);
      expect(validate("published", typeInfo)).toHaveLength(1);
    });

    it("should validate number literal", () => {
      const typeInfo: TypeInfo = { kind: "literal", value: 42 };
      expect(validate(42, typeInfo)).toEqual([]);
      expect(validate(43, typeInfo)).toHaveLength(1);
    });
  });

  describe("array types", () => {
    it("should validate array of strings", () => {
      const typeInfo: TypeInfo = {
        kind: "array",
        elementType: { kind: "string" },
      };
      expect(validate(["a", "b", "c"], typeInfo)).toEqual([]);
      expect(validate("not an array", typeInfo)).toHaveLength(1);
    });

    it("should validate array elements", () => {
      const typeInfo: TypeInfo = {
        kind: "array",
        elementType: { kind: "number" },
      };
      const errors = validate([1, "two", 3], typeInfo);
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("[1]");
    });
  });

  describe("object types", () => {
    it("should validate required properties", () => {
      const typeInfo: TypeInfo = {
        kind: "object",
        properties: [
          { name: "title", type: { kind: "string" }, optional: false },
          { name: "count", type: { kind: "number" }, optional: false },
        ],
      };

      expect(validate({ title: "Hello", count: 42 }, typeInfo)).toEqual([]);

      const errors = validate({ title: "Hello" }, typeInfo);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("MISSING_PROPERTY");
    });

    it("should allow optional properties to be missing", () => {
      const typeInfo: TypeInfo = {
        kind: "object",
        properties: [
          { name: "title", type: { kind: "string" }, optional: false },
          { name: "author", type: { kind: "string" }, optional: true },
        ],
      };

      expect(validate({ title: "Hello" }, typeInfo)).toEqual([]);
      expect(validate({ title: "Hello", author: "John" }, typeInfo)).toEqual([]);
    });

    it("should validate nested objects", () => {
      const typeInfo: TypeInfo = {
        kind: "object",
        properties: [
          {
            name: "author",
            type: {
              kind: "object",
              properties: [
                { name: "name", type: { kind: "string" }, optional: false },
              ],
            },
            optional: false,
          },
        ],
      };

      expect(validate({ author: { name: "John" } }, typeInfo)).toEqual([]);

      const errors = validate({ author: { name: 123 } }, typeInfo);
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("author.name");
    });

    it("should report extra properties by default", () => {
      const typeInfo: TypeInfo = {
        kind: "object",
        properties: [
          { name: "title", type: { kind: "string" }, optional: false },
        ],
      };

      const errors = validate(
        { title: "Hello", extra: "field" },
        typeInfo
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("EXTRA_PROPERTY");
    });

    it("should allow extra properties with allowExtraProps: true", () => {
      const typeInfo: TypeInfo = {
        kind: "object",
        properties: [
          { name: "title", type: { kind: "string" }, optional: false },
        ],
      };

      const errors = validate(
        { title: "Hello", extra: "field" },
        typeInfo,
        { allowExtraProps: true }
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("union types", () => {
    it("should validate union of literals", () => {
      const typeInfo: TypeInfo = {
        kind: "union",
        types: [
          { kind: "literal", value: "draft" },
          { kind: "literal", value: "published" },
        ],
      };

      expect(validate("draft", typeInfo)).toEqual([]);
      expect(validate("published", typeInfo)).toEqual([]);
      expect(validate("archived", typeInfo)).toHaveLength(1);
    });

    it("should validate union of different types", () => {
      const typeInfo: TypeInfo = {
        kind: "union",
        types: [{ kind: "string" }, { kind: "number" }],
      };

      expect(validate("hello", typeInfo)).toEqual([]);
      expect(validate(42, typeInfo)).toEqual([]);
      expect(validate(true, typeInfo)).toHaveLength(1);
    });
  });
});
