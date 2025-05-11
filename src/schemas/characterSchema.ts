import { z } from "zod";

export const characterSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
});

export type Character = z.infer<typeof characterSchema>;
