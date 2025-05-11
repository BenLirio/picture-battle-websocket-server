import { z } from "zod";

export const GameStateSchema = z.enum(["WAITING_FOR_PLAYERS"]);
export type GameState = z.infer<typeof GameStateSchema>;

export const GameSchema = z.object({
  id: z.string().uuid(),
  playerIds: z.array(z.string().uuid()),
  state: GameStateSchema,
});
export type Game = z.infer<typeof GameSchema>;
