import * as ts from "typescript";
import * as path from "node:path";
import type { TypeInfo, PropertyInfo } from "../types.js";

/**
 * Cache for TypeScript programs to avoid recreating them for the same file
 */
const programCache = new Map<string, ts.Program>();

/**
 * Extract type information from a TypeScript file
 */
export function extractTypeInfo(
  filePath: string,
  typeName: string,
  basePath: string
): TypeInfo | null {
  const absolutePath = path.resolve(basePath, filePath);

  // Get program from cache or create new one
  let program = programCache.get(absolutePath);
  if (!program) {
    program = ts.createProgram([absolutePath], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
    });
    programCache.set(absolutePath, program);
  }

  const sourceFile = program.getSourceFile(absolutePath);
  if (!sourceFile) {
    return null;
  }

  const typeChecker = program.getTypeChecker();

  // Find the type
  let foundType: ts.Type | null = null;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
      foundType = typeChecker.getTypeAtLocation(node);
    } else if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      foundType = typeChecker.getTypeAtLocation(node);
    }
  });

  if (!foundType) {
    return null;
  }

  return convertTsTypeToTypeInfo(foundType, typeChecker, new Set<number>());
}

/**
 * Convert TypeScript type to TypeInfo
 */
function convertTsTypeToTypeInfo(
  type: ts.Type,
  checker: ts.TypeChecker,
  visited: Set<number>
): TypeInfo {
  // Get type ID for circular reference detection
  const typeId = (type as ts.Type & { id?: number }).id;

  // Only prevent circular references for object types (exclude primitives)
  const isObjectLike = type.getFlags() & ts.TypeFlags.Object;
  if (typeId !== undefined && isObjectLike && visited.has(typeId)) {
    return { kind: "any" };
  }
  if (typeId !== undefined && isObjectLike) {
    visited.add(typeId);
  }

  const flags = type.getFlags();

  // Primitive types
  if (flags & ts.TypeFlags.String) {
    return { kind: "string" };
  }
  if (flags & ts.TypeFlags.Number) {
    return { kind: "number" };
  }
  if (flags & ts.TypeFlags.Boolean) {
    return { kind: "boolean" };
  }
  if (flags & ts.TypeFlags.Null) {
    return { kind: "null" };
  }
  if (flags & ts.TypeFlags.Undefined) {
    return { kind: "undefined" };
  }
  if (flags & ts.TypeFlags.Any) {
    return { kind: "any" };
  }
  if (flags & ts.TypeFlags.Unknown) {
    return { kind: "unknown" };
  }

  // Literal types
  if (flags & ts.TypeFlags.StringLiteral) {
    return {
      kind: "literal",
      value: (type as ts.StringLiteralType).value,
    };
  }
  if (flags & ts.TypeFlags.NumberLiteral) {
    return {
      kind: "literal",
      value: (type as ts.NumberLiteralType).value,
    };
  }
  if (flags & ts.TypeFlags.BooleanLiteral) {
    // In TypeScript's internal representation, true and false are separate types
    const intrinsicName = (type as ts.Type & { intrinsicName?: string })
      .intrinsicName;
    return {
      kind: "literal",
      value: intrinsicName === "true",
    };
  }

  // Union types
  if (type.isUnion()) {
    const types = type.types.map((t) => convertTsTypeToTypeInfo(t, checker, visited));
    return { kind: "union", types };
  }

  // Intersection types
  if (type.isIntersection()) {
    const types = type.types.map((t) => convertTsTypeToTypeInfo(t, checker, visited));
    return { kind: "intersection", types };
  }

  // Array types
  if (checker.isArrayType(type)) {
    const typeArgs = (type as ts.TypeReference).typeArguments;
    if (typeArgs && typeArgs.length > 0) {
      return {
        kind: "array",
        elementType: convertTsTypeToTypeInfo(typeArgs[0], checker, visited),
      };
    }
    return { kind: "array", elementType: { kind: "any" } };
  }

  // Object types
  if (flags & ts.TypeFlags.Object) {
    const properties: PropertyInfo[] = [];

    for (const prop of type.getProperties()) {
      const propType = checker.getTypeOfSymbolAtLocation(
        prop,
        prop.valueDeclaration || prop.declarations![0]
      );

      const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;

      properties.push({
        name: prop.getName(),
        type: convertTsTypeToTypeInfo(propType, checker, visited),
        optional: isOptional,
      });
    }

    return { kind: "object", properties };
  }

  // Treat everything else as any
  return { kind: "any" };
}

/**
 * Result of analyzing a schema file for exported types
 */
export interface SchemaFileAnalysis {
  /** Names of exported type aliases */
  types: string[];
  /** Names of exported interfaces */
  interfaces: string[];
  /** Names of exported values (potential Zod schemas) */
  values: string[];
}

/**
 * Analyze a TypeScript file for exported types and values
 * @param filePath - Path to the TypeScript file
 * @param basePath - Base directory for resolving relative paths
 * @returns Analysis result with exported types, interfaces, and values
 */
export function analyzeSchemaFile(
  filePath: string,
  basePath: string
): SchemaFileAnalysis {
  const absolutePath = path.resolve(basePath, filePath);

  // Get program from cache or create new one
  let program = programCache.get(absolutePath);
  if (!program) {
    program = ts.createProgram([absolutePath], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
    });
    programCache.set(absolutePath, program);
  }

  const sourceFile = program.getSourceFile(absolutePath);
  if (!sourceFile) {
    return { types: [], interfaces: [], values: [] };
  }

  const types: string[] = [];
  const interfaces: string[] = [];
  const values: string[] = [];

  ts.forEachChild(sourceFile, (node) => {
    // Check for export modifier
    const hasExportModifier =
      ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (hasExportModifier) {
      // Exported type alias: export type Foo = {...}
      if (ts.isTypeAliasDeclaration(node)) {
        types.push(node.name.text);
      }
      // Exported interface: export interface Foo {...}
      else if (ts.isInterfaceDeclaration(node)) {
        interfaces.push(node.name.text);
      }
      // Exported variable: export const fooSchema = z.object({...})
      else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            values.push(decl.name.text);
          }
        }
      }
    }

    // Check for default export: export default ...
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      values.push("default");
    }
  });

  return { types, interfaces, values };
}

/**
 * Convert TypeInfo to a human-readable string
 */
export function typeInfoToString(typeInfo: TypeInfo): string {
  switch (typeInfo.kind) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "undefined":
      return "undefined";
    case "any":
      return "any";
    case "unknown":
      return "unknown";
    case "literal":
      return typeof typeInfo.value === "string"
        ? `"${typeInfo.value}"`
        : String(typeInfo.value);
    case "array":
      return `${typeInfoToString(typeInfo.elementType)}[]`;
    case "object":
      if (typeInfo.properties.length === 0) {
        return "{}";
      }
      const props = typeInfo.properties
        .map(
          (p) =>
            `${p.name}${p.optional ? "?" : ""}: ${typeInfoToString(p.type)}`
        )
        .join(", ");
      return `{ ${props} }`;
    case "union":
      return typeInfo.types.map(typeInfoToString).join(" | ");
    case "intersection":
      return typeInfo.types.map(typeInfoToString).join(" & ");
  }
}
