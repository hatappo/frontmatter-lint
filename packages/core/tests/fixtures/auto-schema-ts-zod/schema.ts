import { z } from "zod";

export const PostSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
});
