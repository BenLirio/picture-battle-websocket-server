import { text } from "stream/consumers";
import { z } from "zod";

export const GameStateSchema = z.enum([
  "WAITING_FOR_PLAYERS",
  "SELECTING_CHARACTERS",
  "GAME_LOOP",
  "GAME_OVER",
]);
export type GameState = z.infer<typeof GameStateSchema>;

export const GameSchema = z.object({
  id: z.string().uuid(),
  playerIds: z.array(z.string().uuid()),
  state: GameStateSchema,
  settings: z.object({
    maxPlayers: z.number().min(2).max(2),
  }),
  characters: z.array(
    z.object({
      playerId: z.string().uuid(),
      characterId: z.string().uuid(),
    })
  ),
  canAct: z.array(z.string().uuid()),
  messages: z.array(
    z.object({
      from: z.string().uuid(),
      message: z.string(),
      tags: z.array(z.enum(["action", "scene", "result", "info"])),
    })
  ),
});
export type Game = z.infer<typeof GameSchema>;
