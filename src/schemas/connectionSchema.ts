import { z } from "zod";

export const ConnectionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Connection = z.infer<typeof ConnectionSchema>;
