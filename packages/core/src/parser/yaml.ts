/**
 * Simple YAML parser
 *
 * Supported:
 * - Scalars: strings (with or without quotes), numbers, booleans, null
 * - Arrays: `- item` format
 * - Objects: `key: value` format, nested supported
 * - Comments: lines starting with `#`
 *
 * Not supported:
 * - Anchors and aliases (&, *)
 * - Multiple documents
 * - Flow style ({a: 1, b: 2})
 * - Tags (!!str, etc.)
 */

type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue };

interface ParseContext {
  lines: string[];
  index: number;
}

/**
 * Parse YAML string and convert to object
 */
export function parseYaml(input: string): Record<string, unknown> {
  const lines = input.split(/\r?\n/);
  const ctx: ParseContext = { lines, index: 0 };
  const result = parseObject(ctx, 0);
  return result as Record<string, unknown>;
}

/**
 * Get current line (skipping comments and empty lines)
 */
function currentLine(ctx: ParseContext): string | null {
  while (ctx.index < ctx.lines.length) {
    const line = ctx.lines[ctx.index];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) {
      ctx.index++;
      continue;
    }

    return line;
  }
  return null;
}

/**
 * Get indent level of a line
 */
function getIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

/**
 * Parse object
 */
function parseObject(
  ctx: ParseContext,
  baseIndent: number
): Record<string, YamlValue> {
  const result: Record<string, YamlValue> = {};

  while (true) {
    const line = currentLine(ctx);
    if (line === null) break;

    const indent = getIndent(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      // Unexpected indent
      break;
    }

    const trimmed = line.trim();

    // Parse key: value format
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) break;

    const key = trimmed.slice(0, colonIndex).trim();
    const valueStr = trimmed.slice(colonIndex + 1).trim();

    ctx.index++;

    if (valueStr === "") {
      // Value is on the next line (nested object or array)
      const nextLine = currentLine(ctx);
      if (nextLine === null) {
        result[key] = null;
      } else {
        const nextIndent = getIndent(nextLine);
        if (nextIndent > indent) {
          const nextTrimmed = nextLine.trim();
          if (nextTrimmed.startsWith("-")) {
            // Array
            result[key] = parseArray(ctx, nextIndent);
          } else {
            // Nested object
            result[key] = parseObject(ctx, nextIndent);
          }
        } else {
          result[key] = null;
        }
      }
    } else if (valueStr.startsWith("-")) {
      // Inline array start (rare but supported)
      // Usually arrays start on a separate line
      result[key] = parseScalar(valueStr);
    } else {
      // Scalar value
      result[key] = parseScalar(valueStr);
    }
  }

  return result;
}

/**
 * Parse array
 */
function parseArray(ctx: ParseContext, baseIndent: number): YamlValue[] {
  const result: YamlValue[] = [];

  while (true) {
    const line = currentLine(ctx);
    if (line === null) break;

    const indent = getIndent(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) break;

    const trimmed = line.trim();
    if (!trimmed.startsWith("-")) break;

    ctx.index++;

    // Parse `- value` or `- key: value`
    const afterDash = trimmed.slice(1).trim();

    if (afterDash === "") {
      // Complex item (nested on next line)
      const nextLine = currentLine(ctx);
      if (nextLine === null) {
        result.push(null);
      } else {
        const nextIndent = getIndent(nextLine);
        if (nextIndent > indent) {
          const nextTrimmed = nextLine.trim();
          if (nextTrimmed.includes(":")) {
            result.push(parseObject(ctx, nextIndent));
          } else {
            result.push(parseScalar(nextTrimmed));
            ctx.index++;
          }
        } else {
          result.push(null);
        }
      }
    } else if (afterDash.includes(":")) {
      // Inline object `- key: value`
      const colonIndex = afterDash.indexOf(":");
      const key = afterDash.slice(0, colonIndex).trim();
      const value = afterDash.slice(colonIndex + 1).trim();

      // Treat as single-key object
      // Also check next lines for additional key:value pairs at same indent
      const obj: Record<string, YamlValue> = {
        [key]: value === "" ? null : parseScalar(value),
      };

      // Check for following properties
      while (true) {
        const nextLine = currentLine(ctx);
        if (nextLine === null) break;
        const nextIndent = getIndent(nextLine);
        // Properties after `-` should be at baseIndent + 2 or so
        if (nextIndent <= baseIndent) break;
        const nextTrimmed = nextLine.trim();
        if (nextTrimmed.startsWith("-")) break;
        if (!nextTrimmed.includes(":")) break;

        const nextColonIndex = nextTrimmed.indexOf(":");
        const nextKey = nextTrimmed.slice(0, nextColonIndex).trim();
        const nextValue = nextTrimmed.slice(nextColonIndex + 1).trim();
        obj[nextKey] = nextValue === "" ? null : parseScalar(nextValue);
        ctx.index++;
      }

      result.push(obj);
    } else {
      // Simple scalar value
      result.push(parseScalar(afterDash));
    }
  }

  return result;
}

/**
 * Parse scalar value
 */
function parseScalar(value: string): YamlValue {
  // null
  if (value === "null" || value === "~" || value === "") {
    return null;
  }

  // boolean
  if (value === "true" || value === "True" || value === "TRUE") {
    return true;
  }
  if (value === "false" || value === "False" || value === "FALSE") {
    return false;
  }

  // Quoted string
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Number
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // ISO 8601 date format (keep as string)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }

  // Everything else is a string
  return value;
}
