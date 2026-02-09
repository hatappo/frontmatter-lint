import { describe, it, expect } from "vitest";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "../src/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "fixtures");

async function lint(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const file = await remark()
    .use(remarkFrontmatter)
    .use(remarkLintFrontmatterType)
    .process({ value: content, path: filePath, cwd: dirname(filePath) });

  return file.messages;
}

describe("remark-lint-frontmatter-type", () => {
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
