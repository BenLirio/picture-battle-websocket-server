import { z } from "zod";

export const PlayerSchema = z.object({
  id: z.string().uuid(),
  connectionIds: z.array(z.string().uuid()),
});
export type Player = z.infer<typeof PlayerSchema>;
