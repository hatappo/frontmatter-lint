import { lintContent, type LintOptions } from "frontmatter-lint";
import type { TextlintRuleModule } from "@textlint/types";
import { dirname, isAbsolute, join } from "node:path";

export interface TextlintRuleFrontmatterTypeOptions extends LintOptions {}

/**
 * textlint rule to validate frontmatter against TypeScript type definitions
 */
const rule: TextlintRuleModule<TextlintRuleFrontmatterTypeOptions> = (
  context,
  options = {}
) => {
  const { Syntax, getSource, report, getFilePath, locator } = context;

  return {
    async [Syntax.Document](node) {
      // ファイルの内容を取得
      const content = getSource(node);

      // ファイルパスを取得
      const filePath = getFilePath() || "unknown";

      // ファイルのディレクトリを basePath として使用
      const basePath = isAbsolute(filePath)
        ? dirname(filePath)
        : join(process.cwd(), dirname(filePath));

      // frontmatter-lint を使って検証
      const result = await lintContent(content, filePath, basePath, options);

      // エラーを textlint 形式で報告
      for (const error of result.errors) {
        report(node, {
          message: error.message,
          padding: locator.at(0),
        });
      }
    },
  };
};

export default rule;
