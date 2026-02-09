import * as fs from "node:fs";
import * as path from "node:path";
import type {
  LintResult,
  LintOptions,
  ValidationError,
} from "./types.js";
import { extractFrontmatter } from "./parser/frontmatter.js";
import { extractTypeInfo, analyzeSchemaFile } from "./checker/type-extractor.js";
import { pathToFileURL } from "node:url";
import type { TypeReference } from "./types.js";
import { validate } from "./checker/validator.js";
import { validateWithZod } from "./checker/zod-validator.js";
import { validateWithJsonSchema } from "./checker/json-schema-validator.js";

/**
 * Create an error result for a file
 */
function createErrorResult(
  file: string,
  code: ValidationError["code"],
  message: string
): LintResult {
  return {
    file,
    valid: false,
    errors: [{ code, message }],
  };
}

/**
 * Create a success result for a file
 */
function createSuccessResult(file: string): LintResult {
  return {
    file,
    valid: true,
    errors: [],
  };
}

/**
 * Result of auto-detecting schema.ts
 */
type AutoDetectResult =
  | { success: true; typeRef: TypeReference }
  | { success: false; error: { code: "MULTIPLE_SCHEMAS_FOUND" | "NO_SCHEMA_IN_FILE"; message: string } };

/**
 * Auto-detect schema from schema.ts
 * @param basePath - Base directory containing schema.ts
 * @returns TypeReference if exactly one schema is found, error otherwise
 */
async function autoDetectSchemaTs(basePath: string): Promise<AutoDetectResult | null> {
  const schemaPath = path.join(basePath, "schema.ts");
  if (!fs.existsSync(schemaPath)) {
    return null;
  }

  // Analyze the file for exported types and values
  const analysis = analyzeSchemaFile("schema.ts", basePath);
  const typeCount = analysis.types.length + analysis.interfaces.length;

  // Check exported values for Zod schemas
  const zodSchemas: string[] = [];
  if (analysis.values.length > 0) {
    try {
      const fileUrl = pathToFileURL(schemaPath).href;
      const module = await import(fileUrl);

      for (const valueName of analysis.values) {
        const value = valueName === "default" ? module.default : module[valueName];
        // Check if it's a Zod schema (has safeParse method)
        if (value && typeof value === "object" && "safeParse" in value) {
          zodSchemas.push(valueName);
        }
      }
    } catch {
      // Import failed, no Zod schemas available
    }
  }

  const totalSchemas = typeCount + zodSchemas.length;

  if (totalSchemas === 0) {
    return {
      success: false,
      error: {
        code: "NO_SCHEMA_IN_FILE",
        message: "No exported type, interface, or Zod schema found in schema.ts",
      },
    };
  }

  if (totalSchemas > 1) {
    const allNames = [
      ...analysis.types,
      ...analysis.interfaces,
      ...zodSchemas,
    ];
    return {
      success: false,
      error: {
        code: "MULTIPLE_SCHEMAS_FOUND",
        message: `Multiple schemas found in schema.ts: ${allNames.join(", ")}. Please use explicit annotation or export only one schema.`,
      },
    };
  }

  // Exactly one schema found
  if (zodSchemas.length === 1) {
    return {
      success: true,
      typeRef: {
        kind: "zod",
        filePath: "schema.ts",
        typeName: zodSchemas[0],
      },
    };
  }

  // TypeScript type or interface
  const typeName = analysis.types[0] || analysis.interfaces[0];
  return {
    success: true,
    typeRef: {
      kind: "typescript",
      filePath: "schema.ts",
      typeName,
    },
  };
}

export type {
  LintResult,
  LintOptions,
  ValidationError,
  TypeInfo,
  PropertyInfo,
  ParsedFrontmatter,
  TypeReference,
  FrontmatterFormat,
  SchemaKind,
} from "./types.js";

export { extractFrontmatter } from "./parser/frontmatter.js";
export { parseYaml } from "./parser/yaml.js";
export { parseToml } from "./parser/toml.js";
export { parseTypeComment } from "./parser/type-comment.js";
export { extractTypeInfo, typeInfoToString, analyzeSchemaFile } from "./checker/type-extractor.js";
export { validate } from "./checker/validator.js";
export { validateWithZod } from "./checker/zod-validator.js";
export { validateWithJsonSchema } from "./checker/json-schema-validator.js";

/**
 * Validate frontmatter in a Markdown file
 *
 * @param filePath - Path to the Markdown file
 * @param options - Lint options
 * @returns Validation result
 */
export async function lintFile(
  filePath: string,
  options: LintOptions = {}
): Promise<LintResult> {
  const absolutePath = path.resolve(filePath);
  const basePath = path.dirname(absolutePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    return createErrorResult(
      filePath,
      "FILE_NOT_FOUND",
      `File not found: ${filePath}`
    );
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  return lintContent(content, filePath, basePath, options);
}

/**
 * Validate frontmatter in Markdown content
 *
 * @param content - Markdown content
 * @param filePath - File path (for error messages)
 * @param basePath - Base path for resolving type definition files
 * @param options - Lint options
 * @returns Validation result
 */
export async function lintContent(
  content: string,
  filePath: string,
  basePath: string,
  options: LintOptions = {}
): Promise<LintResult> {
  // Apply default options
  const resolvedOptions: LintOptions = {
    allowExtraProps: false, // Default: extra properties are not allowed
    ...options,
  };

  // Extract frontmatter
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    return createSuccessResult(filePath);
  }

  // Get type reference
  let typeRef = frontmatter.typeRef;

  // Auto-detect schema if no explicit type reference
  if (!typeRef && !resolvedOptions.noAutoSchema) {
    // Priority 1: schema.json
    const autoJsonSchemaPath = path.join(basePath, "schema.json");
    if (fs.existsSync(autoJsonSchemaPath)) {
      typeRef = {
        kind: "jsonschema",
        filePath: "schema.json",
        typeName: "",
      };
    } else {
      // Priority 2: schema.ts
      const schemaTsResult = await autoDetectSchemaTs(basePath);
      if (schemaTsResult) {
        if (!schemaTsResult.success) {
          return createErrorResult(
            filePath,
            schemaTsResult.error.code,
            schemaTsResult.error.message
          );
        }
        typeRef = schemaTsResult.typeRef;
      }
    }
  }

  if (!typeRef) {
    // No schema comment found and no auto-detected schema
    if (resolvedOptions.requireSchema) {
      return createErrorResult(
        filePath,
        "MISSING_SCHEMA_ANNOTATION",
        "Frontmatter is missing # @type, # @zod, or # @jsonschema comment"
      );
    }
    // Skip if requireSchema is not set
    return createSuccessResult(filePath);
  }

  // Run validation based on schema kind
  let errors: ValidationError[];

  if (typeRef.kind === "zod") {
    // Validate with Zod schema
    errors = await validateWithZod(
      frontmatter.data,
      typeRef.filePath,
      typeRef.typeName,
      basePath,
      resolvedOptions
    );
  } else if (typeRef.kind === "jsonschema") {
    // Validate with JSON Schema
    errors = validateWithJsonSchema(
      frontmatter.data,
      typeRef.filePath,
      basePath,
      resolvedOptions
    );
  } else {
    // Validate with TypeScript type definition
    const typeInfo = extractTypeInfo(
      typeRef.filePath,
      typeRef.typeName,
      basePath
    );
    if (!typeInfo) {
      return createErrorResult(
        filePath,
        "TYPE_NOT_FOUND",
        `Type '${typeRef.typeName}' not found in '${typeRef.filePath}'`
      );
    }

    errors = validate(frontmatter.data, typeInfo, resolvedOptions);
  }

  return {
    file: filePath,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple Markdown files
 *
 * @param filePaths - Array of paths to Markdown files
 * @param options - Lint options
 * @returns Array of validation results
 */
export async function lintFiles(
  filePaths: string[],
  options: LintOptions = {}
): Promise<LintResult[]> {
  return Promise.all(filePaths.map((filePath) => lintFile(filePath, options)));
}
