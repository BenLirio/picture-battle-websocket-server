import { APIGatewayEvent } from "aws-lambda";
import { characterDatabase, gameDatabase, playerDatabase } from "../database";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "../utils/responseUtils";
import { z } from "zod";
import { Socket } from "../connections/Socket";
import { GameSocket } from "../connections/GameSocket";
import { completeConversation } from "../ai/gemeni";
import { error } from "console";

const DoActionInputSchema = z.object({
  action: z.literal("doAction"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
    action: z.string(),
  }),
});

export const doActionHandler = withErrorHandling(
  async (event: APIGatewayEvent) => {
    const {
      data: { gameId, playerId, playerToken, action },
    } = DoActionInputSchema.parse(JSON.parse(event.body!));
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
      return errorResponse("Internal server error");
    }

    // Verify game exists
    const game = await gameDatabase.get(gameId);
    if (!game) {
      return errorResponse("Game not found");
    }
    const gameSocket: GameSocket = new GameSocket(event, game);

    // Verify player exists
    const player = await playerDatabase.get(playerId);
    if (!player) {
      return errorResponse("Player not found");
    }

    // Verify player token matches
    if (player.token !== playerToken) {
      return errorResponse("Invalid player token");
    }

    // Verify player is in the game
    if (!game.playerIds.includes(playerId)) {
      return errorResponse("Player is not in this game");
    }

    // Verify player is in the canAct list
    if (!game.canAct.includes(playerId)) {
      return errorResponse("It is not your turn to act");
    }

    // Increment turn
    if (game.settings.maxPlayers !== 2 || game.playerIds.length !== 2) {
      return errorResponse("Invalid game state for action");
    }

    game.messages.push({
      from: playerId,
      message: action,
      tags: ["action"],
    });
    game.canAct = [];
    await gameSocket.updateGame();

    const nextPlayerId = game.playerIds.find((id) => id !== playerId)!;
    game.canAct = [nextPlayerId];

    const characterDescriptions = await Promise.all(
      game.characters.map(async ({ playerId, characterId }) => {
        const { description } = (await characterDatabase.get(characterId))!;
        return { playerId, description };
      })
    );
    const idToDescriptionMap = Object.fromEntries(
      characterDescriptions.map(({ playerId, description }) => [
        playerId,
        description,
      ])
    );

    const response = await completeConversation(
      game.messages
        .filter(
          ({ tags }) =>
            tags.includes("action") ||
            tags.includes("scene") ||
            tags.includes("result")
        )
        .map(({ message, from, tags }) => ({
          role: tags.includes("result") ? "model" : "user",
          text: idToDescriptionMap[from]
            ? `${idToDescriptionMap[from]}: ${message}`
            : message,
        }))
    );
    game.messages.push({
      from: game.id,
      message: response,
      tags: ["result"],
    });
    gameSocket.updateGame();

    if (action === "win") {
      game.state = "GAME_OVER";
      game.canAct = [];
      game.messages.push({
        from: game.id,
        message: `Player ${playerId} has won the game!`,
        tags: ["info"],
      });
      await gameSocket.updateGame();
    }

    await gameDatabase.update(game);

    return successResponse("Action received");
  }
);
