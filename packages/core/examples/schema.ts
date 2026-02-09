import { z } from "zod";

/**
 * Blog post frontmatter schema
 */
export const BlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});

/**
 * Published post schema (stricter)
 */
const PublishedPostSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.string(),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  draft: z.literal(false),
});
