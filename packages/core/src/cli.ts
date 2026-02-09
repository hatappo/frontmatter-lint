#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { lintFile } from "./index.js";
import type { LintOptions, LintResult } from "./types.js";

interface CliOptions extends LintOptions {
  help?: boolean;
  version?: boolean;
}

function parseArgs(args: string[]): { files: string[]; options: CliOptions } {
  const files: string[] = [];
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--allow-extra-props") {
      options.allowExtraProps = true;
    } else if (arg === "--require-schema") {
      options.requireSchema = true;
    } else if (arg === "--no-auto-schema") {
      options.noAutoSchema = true;
    } else if (!arg.startsWith("-")) {
      files.push(arg);
    }
  }

  return { files, options };
}

function printHelp(): void {
  console.log(`
fmlint - Markdown frontmatter type checker

Usage:
  fmlint [options] <files...>

Options:
  -h, --help              Show help
  -v, --version           Show version
  --allow-extra-props     Allow properties not defined in schema
  --require-schema        Require schema annotation comment
  --no-auto-schema        Disable auto-detection of schema.json

Examples:
  fmlint posts/*.md
  fmlint --allow-extra-props content/**/*.md
  fmlint --require-schema posts/*.md

Schema annotation in frontmatter:
  # Using TypeScript type
  ---
  # @type ./types.ts BlogPost
  title: "Article Title"
  date: 2024-01-01
  ---

  # Using Zod schema
  ---
  # @zod ./schema.ts BlogPostSchema
  title: "Article Title"
  date: 2024-01-01
  ---

  # Using JSON Schema
  ---
  # @jsonschema ./schema.json
  title: "Article Title"
  date: 2024-01-01
  ---

Auto-detection:
  If no schema annotation is present, fmlint will automatically use
  schema.json in the same directory if it exists.
  Use --no-auto-schema to disable this behavior.
`);
}

function printVersion(): void {
  try {
    const pkgPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../package.json"
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    console.log(`fmlint v${pkg.version}`);
  } catch {
    console.log("fmlint v0.1.0");
  }
}

function formatResult(result: LintResult): string {
  if (result.valid) {
    return `✓ ${result.file}`;
  }

  const lines = [`✗ ${result.file}`];
  for (const error of result.errors) {
    lines.push(`  - ${error.message}`);
  }
  return lines.join("\n");
}

function expandGlob(pattern: string): string[] {
  // Simple glob expansion (supports * only)
  if (!pattern.includes("*")) {
    return [pattern];
  }

  const dir = path.dirname(pattern);
  const filePattern = path.basename(pattern);
  const regex = new RegExp(
    "^" + filePattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
  );

  try {
    // Use withFileTypes to avoid separate statSync calls for each file
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && regex.test(entry.name))
      .map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { files: patterns, options } = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    printVersion();
    process.exit(0);
  }

  if (patterns.length === 0) {
    console.error("Error: Please specify files");
    console.error("Help: fmlint --help");
    process.exit(1);
  }

  // Expand file patterns
  const files: string[] = [];
  for (const pattern of patterns) {
    const expanded = expandGlob(pattern);
    if (expanded.length === 0) {
      console.error(`Warning: No files match pattern: ${pattern}`);
    }
    files.push(...expanded);
  }

  if (files.length === 0) {
    console.error("Error: No files to process");
    process.exit(1);
  }

  // Run validation
  const results: LintResult[] = [];
  for (const file of files) {
    const result = await lintFile(file, options);
    results.push(result);
    console.log(formatResult(result));
  }

  // Summary
  const total = results.length;
  const passed = results.filter((r) => r.valid).length;
  const failed = total - passed;

  console.log("");
  console.log(`Total: ${total} files, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
