import type { TypeReference } from "../types.js";

/**
 * @type comment pattern
 * Example: # @type ./types.ts BlogPost
 * Example: # @type ../schemas/blog.ts BlogPost
 */
const TYPE_COMMENT_REGEX = /^#\s*@type\s+(\S+)\s+(\S+)\s*$/;

/**
 * @zod comment pattern
 * Example: # @zod ./schema.ts BlogPostSchema
 * Example: # @zod ../schemas/blog.ts BlogPostSchema
 */
const ZOD_COMMENT_REGEX = /^#\s*@zod\s+(\S+)\s+(\S+)\s*$/;

/**
 * @jsonschema comment pattern (file path only, no type name needed)
 * Example: # @jsonschema ./schema.json
 * Example: # @jsonschema ../schemas/blog.schema.json
 */
const JSONSCHEMA_COMMENT_REGEX = /^#\s*@jsonschema\s+(\S+)\s*$/;

/**
 * Parse @type, @zod, or @jsonschema comment line
 * @param line - Line to parse
 * @returns TypeReference or null
 */
export function parseTypeComment(line: string): TypeReference | null {
  const trimmed = line.trim();

  // Check @type pattern
  const typeMatch = trimmed.match(TYPE_COMMENT_REGEX);
  if (typeMatch) {
    const [, filePath, typeName] = typeMatch;
    return {
      kind: "typescript",
      filePath,
      typeName,
    };
  }

  // Check @zod pattern
  const zodMatch = trimmed.match(ZOD_COMMENT_REGEX);
  if (zodMatch) {
    const [, filePath, typeName] = zodMatch;
    return {
      kind: "zod",
      filePath,
      typeName,
    };
  }

  // Check @jsonschema pattern
  const jsonSchemaMatch = trimmed.match(JSONSCHEMA_COMMENT_REGEX);
  if (jsonSchemaMatch) {
    const [, filePath] = jsonSchemaMatch;
    return {
      kind: "jsonschema",
      filePath,
      typeName: "",
    };
  }

  return null;
}
