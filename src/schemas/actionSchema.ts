import { z } from "zod";

export const ActionSchema = z.object({
  id: z.string().uuid(),
  actions: z.array(z.string()),
});

export type Action = z.infer<typeof ActionSchema>;
