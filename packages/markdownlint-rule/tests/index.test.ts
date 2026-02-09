import { describe, it, expect } from "vitest";
import { lint } from "markdownlint/promise";
import rule from "../src/index.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "fixtures");

describe("markdownlint-rule-frontmatter-type", () => {
  it("should pass for valid frontmatter", async () => {
    const filePath = join(fixturesDir, "valid.md");
    const result = await lint({
      files: [filePath],
      customRules: [rule],
      config: {
        default: false, // 組み込みルールを無効化
        "frontmatter-type": true,
      },
    });
    const validMdResults = result[filePath] || [];
    expect(validMdResults).toHaveLength(0);
  });

  it("should report errors for invalid frontmatter", async () => {
    const filePath = join(fixturesDir, "invalid.md");
    const result = await lint({
      files: [filePath],
      customRules: [rule],
      config: {
        default: false, // 組み込みルールを無効化
        "frontmatter-type": true,
      },
    });
    const invalidMdResults = result[filePath] || [];

    // invalid.md には title が欠けていて date の型が間違っている
    expect(invalidMdResults.length).toBeGreaterThan(0);

    // エラーがfrontmatter-typeルールから来ていることを確認
    const frontmatterErrors = invalidMdResults.filter(
      (err) =>
        err.ruleNames.includes("frontmatter-type") ||
        err.ruleNames.includes("fml001")
    );
    expect(frontmatterErrors.length).toBeGreaterThan(0);
  });

  it("should have correct rule metadata", () => {
    expect(rule.names).toContain("frontmatter-type");
    expect(rule.names).toContain("fml001");
    expect(rule.description).toBe(
      "Validate frontmatter against TypeScript type definitions"
    );
    expect(rule.tags).toContain("frontmatter");
    expect(rule.tags).toContain("typescript");
  });
});
