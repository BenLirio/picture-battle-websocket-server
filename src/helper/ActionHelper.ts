import { Schema, Type } from "@google/genai";
import { complete, structuredComplete } from "../ai/gemeni";
import { GameSocket } from "../connections/GameSocket";
import { characterDatabase, gameDatabase } from "../database";
import { Game } from "../schemas/gameSchema";
import { structuredOutputCompletion } from "../ai/openai";
import { z } from "zod";
import { actionDatabase } from "../database/actionDatabase"; // Import actionDatabase
import { v4 as uuidv4 } from "uuid"; // Import uuid

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
    const playerActionResults = await Promise.all(
      this.game.characters.map(async ({ characterId, playerId }) => {
        const { description } = (await characterDatabase.get(characterId))!;
        const { actions }: ActionsResponse =
          await structuredOutputCompletion<ActionsResponse>(
            `Generate a list of 3 actions that the character ${description} can take in a duel game`,
            ActionsResponseSchema
          );
        // Save actions to database
        const actionId = uuidv4(); // Generate UUID
        await actionDatabase.create({ id: actionId, actions }); // Pass id and actions
        return { playerId, actionId, actions }; // Return actionId and actions
      })
    );

    // Update game actions with playerId and actionId
    this.game.actions = playerActionResults.map(({ playerId, actionId }) => ({
      playerId,
      actionId,
    }));

    // Send actions to players
    playerActionResults.forEach(({ playerId, actions }) => {
      this.gameSocket.sendToPlayer(playerId, {
        type: "set_actions",
        data: { actions },
      });
    });
  }

  public async executeAction(playerId: string, actionIndex: number) {
    if (!this.game.canAct.includes(playerId)) {
      throw new Error("Player is not allowed to act at this time.");
    }
    this.game.canAct = this.game.canAct.filter((id) => id !== playerId);

    const { actionId } = this.game.actions.find(
      (action) => action.playerId === playerId
    )!;

    const { actions } = (await actionDatabase.get(actionId))!;

    if (actionIndex < 0 || actionIndex >= actions.length) {
      throw new Error("Invalid action index.");
    }

    const action = actions[actionIndex];

    console.log(`Executing action: ${action} for playerId: ${playerId}`);

    this.gameSocket.updateGame();
    await gameDatabase.update(this.game);
  }
}
