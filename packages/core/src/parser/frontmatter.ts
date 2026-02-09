import type { ParsedFrontmatter, TypeReference, FrontmatterFormat } from "../types.js";
import { parseYaml } from "./yaml.js";
import { parseToml } from "./toml.js";
import { parseTypeComment } from "./type-comment.js";

// YAML: ---, TOML: +++
const YAML_REGEX = /^---\r?\n([\s\S]*?)(?:\r?\n)?---/;
const TOML_REGEX = /^\+\+\+\r?\n([\s\S]*?)(?:\r?\n)?\+\+\+/;

interface FrontmatterMatch {
  raw: string;
  format: FrontmatterFormat;
}

/**
 * Detect and extract frontmatter
 */
function matchFrontmatter(content: string): FrontmatterMatch | null {
  // Check YAML format
  const yamlMatch = content.match(YAML_REGEX);
  if (yamlMatch) {
    return { raw: yamlMatch[1], format: "yaml" };
  }

  // Check TOML format
  const tomlMatch = content.match(TOML_REGEX);
  if (tomlMatch) {
    return { raw: tomlMatch[1], format: "toml" };
  }

  return null;
}

/**
 * Extract frontmatter from Markdown file
 */
export function extractFrontmatter(
  content: string
): ParsedFrontmatter | null {
  const match = matchFrontmatter(content);
  if (!match) {
    return null;
  }

  const { raw, format } = match;
  const lines = raw.split(/\r?\n/);

  // Find @type comment (common for YAML/TOML: # @type)
  let typeRef: TypeReference | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    const typeComment = parseTypeComment(line);
    if (typeComment) {
      typeRef = typeComment;
    } else {
      dataLines.push(line);
    }
  }

  // Parse according to format
  const dataContent = dataLines.join("\n");
  let data: Record<string, unknown>;

  if (format === "toml") {
    data = parseToml(dataContent);
  } else {
    data = parseYaml(dataContent);
  }

  // Calculate line numbers
  const startLine = 1; // Opening delimiter line
  const endLine = raw.split(/\r?\n/).length + 2; // Including closing delimiter

  return {
    data,
    typeRef,
    format,
    raw,
    startLine,
    endLine,
  };
}

/**
 * Extract frontmatter from multiple Markdown files
 */
export function extractFrontmatters(
  files: { path: string; content: string }[]
): { path: string; frontmatter: ParsedFrontmatter | null }[] {
  return files.map((file) => ({
    path: file.path,
    frontmatter: extractFrontmatter(file.content),
  }));
}
