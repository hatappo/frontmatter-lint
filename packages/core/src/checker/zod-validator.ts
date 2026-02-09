import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { ValidationError, LintOptions } from "../types.js";

/**
 * Validate data using a Zod schema
 * @param data - Frontmatter data to validate
 * @param schemaPath - Path to the schema file
 * @param schemaName - Name of the exported schema
 * @param basePath - Base directory for resolving relative paths
 * @param options - Lint options
 * @returns Array of validation errors
 */
export async function validateWithZod(
  data: Record<string, unknown>,
  schemaPath: string,
  schemaName: string,
  basePath: string,
  options: LintOptions = {}
): Promise<ValidationError[]> {
  const absolutePath = path.resolve(basePath, schemaPath);

  // Dynamically import the schema file
  let schemaModule: Record<string, unknown>;
  try {
    // File URL is required for ESM dynamic imports
    const fileUrl = pathToFileURL(absolutePath).href;
    schemaModule = await import(fileUrl);
  } catch (error) {
    return [
      {
        code: "FILE_NOT_FOUND",
        message: `Schema file not found: ${schemaPath}`,
      },
    ];
  }

  // Get the specified schema
  const schema = schemaModule[schemaName];
  if (!schema) {
    return [
      {
        code: "SCHEMA_NOT_FOUND",
        message: `Schema '${schemaName}' not found in '${schemaPath}'`,
      },
    ];
  }

  // Check if it's a valid Zod schema (by checking for safeParse method)
  if (typeof schema !== "object" || schema === null || !("safeParse" in schema)) {
    return [
      {
        code: "INVALID_SCHEMA",
        message: `'${schemaName}' is not a valid Zod schema`,
      },
    ];
  }

  // Use strict mode when allowExtraProps is not enabled
  type ZodSchema = {
    safeParse: (data: unknown) => { success: boolean; error?: { issues: ZodIssue[] } };
    strict?: () => ZodSchema;
  };

  let targetSchema = schema as ZodSchema;
  if (!options.allowExtraProps && typeof targetSchema.strict === "function") {
    targetSchema = targetSchema.strict();
  }

  // Execute validation with safeParse
  const result = targetSchema.safeParse(data);

  if (result.success) {
    return [];
  }

  // Convert Zod errors to ValidationError
  return result.error!.issues.map((issue) => convertZodIssue(issue));
}

/**
 * Simplified Zod issue type
 */
interface ZodIssue {
  code: string;
  message: string;
  path: (string | number)[];
  expected?: string;
  received?: string;  // Zod 3.x
  keys?: string[];    // For unrecognized_keys
  // Zod 4.x doesn't have received field, it's included in message
}

/**
 * Extract received type from Zod 4.x message
 * Example: "Invalid input: expected string, received undefined" -> "undefined"
 */
function extractReceived(message: string): string | undefined {
  const match = message.match(/received\s+(\w+)/i);
  return match ? match[1] : undefined;
}

/**
 * Convert Zod issue to ValidationError
 */
function convertZodIssue(issue: ZodIssue): ValidationError {
  const pathStr = issue.path.join(".");
  const pathLabel = pathStr || "root";

  // Map based on Zod error code
  switch (issue.code) {
    case "invalid_type": {
      // received is direct in Zod 3.x, extracted from message in 4.x
      const received = issue.received || extractReceived(issue.message);

      // Treat undefined as MISSING_PROPERTY
      if (received === "undefined") {
        return {
          code: "MISSING_PROPERTY",
          message: `Required property '${pathLabel}' is missing`,
          path: pathStr || undefined,
          expected: issue.expected,
        };
      }
      return {
        code: "TYPE_MISMATCH",
        message: `'${pathLabel}' expected ${issue.expected}, but received ${received}`,
        path: pathStr || undefined,
        expected: issue.expected,
        actual: received,
      };
    }

    case "unrecognized_keys": {
      // Get extra property names from keys array
      const extraKeys = issue.keys || [];
      const keysList = extraKeys.map((k) => `'${k}'`).join(", ");
      return {
        code: "EXTRA_PROPERTY",
        message: `Property ${keysList} is not defined in schema`,
        path: pathStr || undefined,
      };
    }

    case "invalid_literal":
    case "invalid_enum_value":
    case "invalid_string":
    case "too_small":
    case "too_big":
    case "custom":
    default:
      return {
        code: "ZOD_VALIDATION_ERROR",
        message: `'${pathLabel}': ${issue.message}`,
        path: pathStr || undefined,
      };
  }
}
