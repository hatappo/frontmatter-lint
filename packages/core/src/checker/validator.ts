import type {
  TypeInfo,
  ValidationError,
  LintOptions,
} from "../types.js";
import { typeInfoToString } from "./type-extractor.js";
import { getActualType } from "../utils/type-utils.js";

/**
 * Validate that a value conforms to TypeInfo
 */
export function validate(
  value: unknown,
  typeInfo: TypeInfo,
  options: LintOptions = {},
  path: string = ""
): ValidationError[] {
  const errors: ValidationError[] = [];

  validateValue(value, typeInfo, path, errors, options);

  return errors;
}

function validateValue(
  value: unknown,
  typeInfo: TypeInfo,
  path: string,
  errors: ValidationError[],
  options: LintOptions
): void {
  switch (typeInfo.kind) {
    case "string":
      if (typeof value !== "string") {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected string, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "string",
          actual: getActualType(value),
        });
      }
      break;

    case "number":
      if (typeof value !== "number") {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected number, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "number",
          actual: getActualType(value),
        });
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected boolean, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "boolean",
          actual: getActualType(value),
        });
      }
      break;

    case "null":
      if (value !== null) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected null, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "null",
          actual: getActualType(value),
        });
      }
      break;

    case "undefined":
      if (value !== undefined) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected undefined, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "undefined",
          actual: getActualType(value),
        });
      }
      break;

    case "any":
    case "unknown":
      // Accept anything
      break;

    case "literal":
      if (value !== typeInfo.value) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected ${JSON.stringify(typeInfo.value)}, but received ${JSON.stringify(value)}`,
          path: path || undefined,
          expected: JSON.stringify(typeInfo.value),
          actual: JSON.stringify(value),
        });
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected array, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "array",
          actual: getActualType(value),
        });
      } else {
        value.forEach((item, index) => {
          validateValue(
            item,
            typeInfo.elementType,
            path ? `${path}[${index}]` : `[${index}]`,
            errors,
            options
          );
        });
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected object, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: "object",
          actual: getActualType(value),
        });
      } else {
        const obj = value as Record<string, unknown>;
        const definedProps = new Set<string>();

        // Check defined properties
        for (const prop of typeInfo.properties) {
          definedProps.add(prop.name);
          const propPath = path ? `${path}.${prop.name}` : prop.name;

          if (!(prop.name in obj)) {
            if (!prop.optional) {
              errors.push({
                code: "MISSING_PROPERTY",
                message: `Required property '${propPath}' is missing`,
                path: propPath,
                expected: typeInfoToString(prop.type),
              });
            }
          } else {
            validateValue(obj[prop.name], prop.type, propPath, errors, options);
          }
        }

        // Check for extra properties
        if (!options.allowExtraProps) {
          for (const key of Object.keys(obj)) {
            if (!definedProps.has(key)) {
              const propPath = path ? `${path}.${key}` : key;
              errors.push({
                code: "EXTRA_PROPERTY",
                message: `Property '${propPath}' is not defined in schema`,
                path: propPath,
              });
            }
          }
        }
      }
      break;

    case "union":
      // For union types, match if any type matches
      const unionErrors: ValidationError[][] = [];
      let matched = false;

      for (const unionType of typeInfo.types) {
        const typeErrors: ValidationError[] = [];
        validateValue(value, unionType, path, typeErrors, options);
        if (typeErrors.length === 0) {
          matched = true;
          break;
        }
        unionErrors.push(typeErrors);
      }

      if (!matched) {
        errors.push({
          code: "TYPE_MISMATCH",
          message: `'${path || "root"}' expected one of ${typeInfoToString(typeInfo)}, but received ${getActualType(value)}`,
          path: path || undefined,
          expected: typeInfoToString(typeInfo),
          actual: getActualType(value),
        });
      }
      break;

    case "intersection":
      // For intersection types, all types must match
      for (const intersectionType of typeInfo.types) {
        validateValue(value, intersectionType, path, errors, options);
      }
      break;
  }
}

