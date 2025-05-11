import { z } from "zod";

export const GameStateSchema = z.enum([
  "WAITING_FOR_PLAYERS",
  "SELECTING_CHARACTERS",
]);
export type GameState = z.infer<typeof GameStateSchema>;

export const GameSchema = z.object({
  id: z.string().uuid(),
  playerIds: z.array(z.string().uuid()),
  state: GameStateSchema,
  settings: z.object({
    maxPlayers: z.number().min(2).max(2),
  }),
});
export type Game = z.infer<typeof GameSchema>;
