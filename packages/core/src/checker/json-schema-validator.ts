import { Ajv, type ErrorObject } from "ajv";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ValidationError, LintOptions } from "../types.js";
import { getActualType } from "../utils/type-utils.js";

/**
 * Validate data using a JSON Schema
 * @param data - Frontmatter data to validate
 * @param schemaPath - Path to the JSON Schema file
 * @param basePath - Base directory for resolving relative paths
 * @param options - Lint options
 * @returns Array of validation errors
 */
export function validateWithJsonSchema(
  data: Record<string, unknown>,
  schemaPath: string,
  basePath: string,
  options: LintOptions = {}
): ValidationError[] {
  const absolutePath = path.resolve(basePath, schemaPath);

  // Load schema file
  let schemaContent: string;
  try {
    schemaContent = fs.readFileSync(absolutePath, "utf-8");
  } catch {
    return [
      {
        code: "FILE_NOT_FOUND",
        message: `Schema file not found: ${schemaPath}`,
      },
    ];
  }

  // Parse JSON
  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(schemaContent);
  } catch {
    return [
      {
        code: "INVALID_JSON",
        message: `Invalid JSON syntax in schema file: ${schemaPath}`,
      },
    ];
  }

  // Compile and validate with ajv
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    verbose: true, // Include data in error objects
  });

  // Disallow extra properties unless allowExtraProps is set
  if (!options.allowExtraProps) {
    schema = { ...schema, additionalProperties: false };
  }

  let validate: ReturnType<typeof ajv.compile>;
  try {
    validate = ajv.compile(schema);
  } catch (error) {
    return [
      {
        code: "INVALID_SCHEMA",
        message: `Invalid JSON Schema: ${error instanceof Error ? error.message : String(error)}`,
      },
    ];
  }

  const valid = validate(data);

  if (valid) {
    return [];
  }

  // Convert ajv errors to ValidationError
  return (validate.errors || []).map(convertAjvError);
}

/**
 * Convert ajv error to ValidationError
 */
function convertAjvError(error: ErrorObject): ValidationError {
  const errorPath = error.instancePath.replace(/^\//, "").replace(/\//g, ".");

  switch (error.keyword) {
    case "required": {
      const missingProperty = (error.params as { missingProperty: string })
        .missingProperty;
      const fullPath = errorPath
        ? `${errorPath}.${missingProperty}`
        : missingProperty;
      return {
        code: "MISSING_PROPERTY",
        message: `Required property '${fullPath}' is missing`,
        path: fullPath,
        expected: "required",
      };
    }

    case "type": {
      const params = error.params as { type: string };
      const actualType = getActualType(error.data);
      return {
        code: "TYPE_MISMATCH",
        message: `'${errorPath || "root"}' expected ${params.type}, but received ${actualType}`,
        path: errorPath || undefined,
        expected: params.type,
        actual: actualType,
      };
    }

    case "additionalProperties": {
      const params = error.params as { additionalProperty: string };
      const fullPath = errorPath
        ? `${errorPath}.${params.additionalProperty}`
        : params.additionalProperty;
      return {
        code: "EXTRA_PROPERTY",
        message: `Property '${fullPath}' is not defined in schema`,
        path: fullPath,
      };
    }

    default:
      return {
        code: "JSONSCHEMA_VALIDATION_ERROR",
        message: `'${errorPath || "root"}': ${error.message}`,
        path: errorPath || undefined,
      };
  }
}
