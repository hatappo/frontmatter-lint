import { describe, it, expect } from "vitest";
import { TextlintKernel } from "@textlint/kernel";
import TextlintPluginMarkdown from "@textlint/textlint-plugin-markdown";
import rule from "../src/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "fixtures");

async function lint(filePath: string) {
  const kernel = new TextlintKernel();
  const content = readFileSync(filePath, "utf-8");

  const result = await kernel.lintText(content, {
    filePath,
    ext: ".md",
    plugins: [
      {
        pluginId: "markdown",
        plugin: TextlintPluginMarkdown.default || TextlintPluginMarkdown,
      },
    ],
    rules: [
      {
        ruleId: "frontmatter-type",
        rule: rule.default || rule,
      },
    ],
  });

  return result.messages;
}

describe("textlint-rule-frontmatter-type", () => {
  it("should pass for valid frontmatter", async () => {
    const messages = await lint(join(fixturesDir, "valid.md"));
    expect(messages).toHaveLength(0);
  });

  it("should report errors for invalid frontmatter", async () => {
    const messages = await lint(join(fixturesDir, "invalid.md"));

    // invalid.md には title が欠けている
    expect(messages.length).toBeGreaterThan(0);

    // エラーメッセージを確認
    const hasPropertyError = messages.some(
      (msg) =>
        msg.message.includes("title") || msg.message.includes("プロパティ")
    );
    expect(hasPropertyError).toBe(true);
  });

  it("should report errors at line 1", async () => {
    const messages = await lint(join(fixturesDir, "invalid.md"));

    // フロントマターのエラーは常に1行目で報告される
    for (const msg of messages) {
      expect(msg.line).toBe(1);
    }
  });
});
