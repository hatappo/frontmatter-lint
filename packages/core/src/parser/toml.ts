/**
 * Simple TOML parser
 *
 * Supported:
 * - Basic types: strings, numbers, booleans
 * - Arrays: ["a", "b"] format
 * - Tables: [section] format
 * - Inline tables: { key = "value" } format
 * - Comments: lines starting with #
 *
 * Not supported:
 * - Datetime types (treated as strings)
 * - Array tables [[array]]
 * - Multiline strings
 */

type TomlValue =
  | string
  | number
  | boolean
  | TomlValue[]
  | { [key: string]: TomlValue };

/**
 * Parse TOML string and convert to object
 */
export function parseToml(input: string): Record<string, unknown> {
  const lines = input.split(/\r?\n/);
  const result: Record<string, TomlValue> = {};
  let currentTable: Record<string, TomlValue> = result;
  let currentTablePath: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    // Table header [section] or [section.subsection]
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      const tablePath = tableMatch[1].split(".").map((s) => s.trim());
      currentTablePath = tablePath;
      currentTable = ensureTable(result, tablePath);
      continue;
    }

    // Key = value
    const kvMatch = line.match(/^([^=]+)=(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const valueStr = kvMatch[2].trim();
      const value = parseTomlValue(valueStr);
      currentTable[key] = value;
    }
  }

  return result as Record<string, unknown>;
}

/**
 * Ensure nested table exists
 */
function ensureTable(
  root: Record<string, TomlValue>,
  path: string[]
): Record<string, TomlValue> {
  let current = root;
  for (const key of path) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, TomlValue>;
  }
  return current;
}

/**
 * Parse TOML value
 */
function parseTomlValue(valueStr: string): TomlValue {
  const trimmed = valueStr.trim();

  // Boolean
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // String (double quotes)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return parseTomlString(trimmed.slice(1, -1));
  }

  // String (single quotes - literal string)
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }

  // Array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return parseTomlArray(trimmed.slice(1, -1));
  }

  // Inline table
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parseInlineTable(trimmed.slice(1, -1));
  }

  // Number (integer)
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Number (floating point)
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Datetime (treat as string)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed;
  }

  // Treat everything else as string
  return trimmed;
}

/**
 * Handle TOML string escapes
 */
function parseTomlString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"');
}

/**
 * Parse TOML array
 */
function parseTomlArray(content: string): TomlValue[] {
  const result: TomlValue[] = [];
  const trimmed = content.trim();

  if (trimmed === "") {
    return result;
  }

  // Simple parsing: split by comma
  // Simplified implementation that doesn't handle nested arrays or tables
  const items = splitArrayItems(trimmed);

  for (const item of items) {
    const trimmedItem = item.trim();
    if (trimmedItem !== "") {
      result.push(parseTomlValue(trimmedItem));
    }
  }

  return result;
}

/**
 * Split array items (considering nesting)
 */
function splitArrayItems(content: string): string[] {
  const items: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    // String start/end
    if ((char === '"' || char === "'") && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (char === "[" || char === "{") {
        depth++;
      } else if (char === "]" || char === "}") {
        depth--;
      } else if (char === "," && depth === 0) {
        items.push(current);
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim() !== "") {
    items.push(current);
  }

  return items;
}

/**
 * Parse inline table
 */
function parseInlineTable(content: string): Record<string, TomlValue> {
  const result: Record<string, TomlValue> = {};
  const trimmed = content.trim();

  if (trimmed === "") {
    return result;
  }

  // Split by comma and parse key=value pairs
  const pairs = splitArrayItems(trimmed);

  for (const pair of pairs) {
    const match = pair.match(/^\s*([^=]+)\s*=\s*(.+)\s*$/);
    if (match) {
      const key = match[1].trim();
      const value = parseTomlValue(match[2].trim());
      result[key] = value;
    }
  }

  return result;
}
