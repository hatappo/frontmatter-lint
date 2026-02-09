import remarkFrontmatter from "remark-frontmatter";
import remarkLintFrontmatterType from "./dist/index.js";

export default {
  plugins: [remarkFrontmatter, remarkLintFrontmatterType],
};
