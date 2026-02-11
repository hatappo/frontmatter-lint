import type { TypeReference } from "../types.js";

/**
 * @schema comment pattern
 * Example: # @schema ./schema.json
 * Example: # @schema ./schema.ts BlogPost
 */
const SCHEMA_COMMENT_REGEX = /^#\s*@schema\s+(\S+)(?:\s+(\S+))?\s*$/;

/**
 * Parse @schema comment line
 * @param line - Line to parse
 * @returns TypeReference or null
 */
export function parseTypeComment(line: string): TypeReference | null {
  const trimmed = line.trim();

  const match = trimmed.match(SCHEMA_COMMENT_REGEX);
  if (!match) {
    return null;
  }

  const [, filePath, typeName] = match;

  // Determine kind based on file extension
  if (filePath.endsWith(".json")) {
    return {
      kind: "jsonschema",
      filePath,
      typeName: "",
    };
  }

  if (filePath.endsWith(".ts")) {
    // For .ts files, we need to analyze the file to determine if it's TypeScript or Zod
    // Use "auto" kind, which will be resolved later
    return {
      kind: "auto",
      filePath,
      typeName: typeName || "",
    };
  }

  // Unsupported file extension
  return null;
}
