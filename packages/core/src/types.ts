/**
 * Schema kind
 */
export type SchemaKind = "typescript" | "zod" | "jsonschema" | "auto";

/**
 * Parsed result of @schema comment
 */
export interface TypeReference {
  /** Schema kind ("auto" for .ts files that need analysis) */
  kind: SchemaKind;
  /** Path to type definition file */
  filePath: string;
  /** Type name or schema name (empty for JSON Schema) */
  typeName: string;
}

/**
 * Frontmatter format
 */
export type FrontmatterFormat = "yaml" | "toml" | "json";

/**
 * Parsed frontmatter
 */
export interface ParsedFrontmatter {
  /** Parsed object */
  data: Record<string, unknown>;
  /** @type comment info (if present) */
  typeRef?: TypeReference;
  /** Frontmatter format */
  format: FrontmatterFormat;
  /** Raw frontmatter text */
  raw: string;
  /** Start line of frontmatter (1-indexed) */
  startLine: number;
  /** End line of frontmatter (1-indexed) */
  endLine: number;
}

/**
 * Structure representing type information
 */
export type TypeInfo =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "undefined" }
  | { kind: "any" }
  | { kind: "unknown" }
  | { kind: "literal"; value: string | number | boolean }
  | { kind: "array"; elementType: TypeInfo }
  | { kind: "object"; properties: PropertyInfo[] }
  | { kind: "union"; types: TypeInfo[] }
  | { kind: "intersection"; types: TypeInfo[] };

/**
 * Object property information
 */
export interface PropertyInfo {
  name: string;
  type: TypeInfo;
  optional: boolean;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error kind */
  code:
    | "MISSING_PROPERTY"
    | "TYPE_MISMATCH"
    | "EXTRA_PROPERTY"
    | "INVALID_FRONTMATTER"
    | "TYPE_NOT_FOUND"
    | "FILE_NOT_FOUND"
    | "MISSING_SCHEMA_ANNOTATION"
    | "SCHEMA_NOT_FOUND"
    | "INVALID_JSON"
    | "INVALID_SCHEMA"
    | "ZOD_VALIDATION_ERROR"
    | "JSONSCHEMA_VALIDATION_ERROR"
    | "MULTIPLE_SCHEMAS_FOUND"
    | "NO_SCHEMA_IN_FILE";
  /** Error message */
  message: string;
  /** Path of the property where error occurred (e.g., "author.name") */
  path?: string;
  /** Expected type */
  expected?: string;
  /** Actual value type */
  actual?: string;
}

/**
 * Lint result
 */
export interface LintResult {
  /** Target file path */
  file: string;
  /** Whether validation succeeded */
  valid: boolean;
  /** Whether validation was skipped (no schema found) */
  skipped: boolean;
  /** Array of errors */
  errors: ValidationError[];
}

/**
 * Lint options
 */
export interface LintOptions {
  /** Allow properties not defined in schema (default: false) */
  allowExtraProps?: boolean;
  /** Require @type/@zod/@jsonschema comment (default: false) */
  requireSchema?: boolean;
  /** Disable auto-detection of schema.json in the same directory (default: false) */
  noAutoSchema?: boolean;
}
