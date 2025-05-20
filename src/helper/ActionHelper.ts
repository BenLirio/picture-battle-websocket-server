import { Schema, Type } from "@google/genai";
import { complete, structuredComplete } from "../ai/gemeni";
import { GameSocket } from "../connections/GameSocket";
import { characterDatabase } from "../database";
import { Game } from "../schemas/gameSchema";
import { structuredOutputCompletion } from "../ai/openai";
import { z } from "zod";

const ActionsResponseSchema = z.object({
  actions: z.array(z.string()),
});
type ActionsResponse = z.infer<typeof ActionsResponseSchema>;

export class ActionHelper {
  readonly gameSocket: GameSocket;
  readonly game: Game;

  constructor(gameSocket: GameSocket, game: Game) {
    this.gameSocket = gameSocket;
    this.game = game;
  }

  private allowAllPlayersToAct() {
    this.game.canAct = [...this.game.playerIds];
  }

  public async setupValidActions() {
    if (this.game.state !== "GAME_LOOP") {
      throw new Error("Game is not in the game loop state.");
    }
    this.allowAllPlayersToAct();
    const playerActions = await Promise.all(
      this.game.characters.map(async ({ characterId, playerId }) => {
        const { description } = (await characterDatabase.get(characterId))!;
        const { actions }: ActionsResponse =
          await structuredOutputCompletion<ActionsResponse>(
            `Generate a list of 3 actions that the character ${description} can take in a duel game`,
            ActionsResponseSchema
          );
        return { playerId, actions };
      })
    );
    playerActions.forEach(({ playerId, actions }) => {
      this.gameSocket.sendToPlayer(playerId, {
        type: "set_actions",
        data: { actions },
      });
    });
  }

  public async executeAction(playerId: string, actionIndex: number) {}
}
