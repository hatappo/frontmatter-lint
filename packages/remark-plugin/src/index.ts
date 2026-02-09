import { lintRule } from "unified-lint-rule";
import { lintContent, type LintOptions } from "frontmatter-lint";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import { dirname, isAbsolute, join } from "node:path";

export interface RemarkLintFrontmatterTypeOptions extends LintOptions {}

/**
 * remark-lint rule to validate frontmatter against TypeScript type definitions
 */
const remarkLintFrontmatterType = lintRule<Root, RemarkLintFrontmatterTypeOptions>(
  {
    origin: "remark-lint:frontmatter-type",
    url: "https://github.com/user/frontmatter-lint",
  },
  async (tree: Root, file: VFile, options?: RemarkLintFrontmatterTypeOptions) => {
    // ファイルの内容を取得
    const content = String(file);

    // ファイルパスを取得
    const filePath = file.path || file.history[0] || "unknown";

    // ファイルのディレクトリを basePath として使用
    // remark-cli の場合、file.path は相対パス、file.cwd は process.cwd()
    // 絶対パスの場合はそのディレクトリを、相対パスの場合は cwd と結合
    const basePath = isAbsolute(filePath)
      ? dirname(filePath)
      : join(file.cwd, dirname(filePath));

    // frontmatter-lint を使って検証
    const result = await lintContent(content, filePath, basePath, options || {});

    // エラーを VFile メッセージとして報告
    for (const error of result.errors) {
      const message = file.message(error.message, {
        place: { line: 1, column: 1 },
        ruleId: "frontmatter-type",
        source: "remark-lint",
      });

      // 追加情報を設定
      if (error.path) {
        message.note = `Property: ${error.path}`;
      }
      if (error.expected) {
        message.expected = [error.expected];
      }
      if (error.actual) {
        message.actual = error.actual;
      }
    }
  }
);

export default remarkLintFrontmatterType;
