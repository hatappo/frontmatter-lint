import { lintContent } from "frontmatter-lint";
import type { Rule, RuleParams, RuleOnError } from "markdownlint";
import { dirname } from "node:path";

/**
 * markdownlint rule to validate frontmatter against TypeScript type definitions
 */
const rule: Rule = {
  names: ["frontmatter-type", "fml001"],
  description: "Validate frontmatter against TypeScript type definitions",
  tags: ["frontmatter", "typescript"],
  parser: "none",
  asynchronous: true,
  function: async (params: RuleParams, onError: RuleOnError) => {
    // フロントマターがない場合はスキップ
    if (!params.frontMatterLines || params.frontMatterLines.length === 0) {
      return;
    }

    // markdownlintはフロントマターとコンテンツを分離して渡すため、
    // 全体を再構築する必要がある
    const frontmatterContent = params.frontMatterLines.join("\n");
    const bodyContent = params.lines.join("\n");
    const content = frontmatterContent + bodyContent;

    // ファイルのディレクトリを basePath として使用
    // （型定義ファイルの相対パス解決に必要）
    const basePath = dirname(params.name);

    // frontmatter-lint を使って検証
    const result = await lintContent(
      content,
      params.name,
      basePath,
      // オプション: params.config から取得可能
      params.config || {}
    );

    // エラーを markdownlint 形式で報告
    for (const error of result.errors) {
      onError({
        lineNumber: 1, // フロントマターは常にファイルの先頭
        detail: error.message,
        context: error.path || undefined,
      });
    }
  },
};

export default rule;
