import { APIGatewayEvent } from "aws-lambda";
import { gameDatabase, playerDatabase } from "../database";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "../utils/responseUtils";
import { z } from "zod";
import { Socket } from "../connections/Socket";
import { GameSocket } from "../connections/GameSocket";

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
    const nextPlayerId = game.playerIds.find((id) => id !== playerId)!;
    game.canAct = [nextPlayerId];

    if (action === "win") {
      game.state = "GAME_OVER";
      game.canAct = [];
    }

    await gameDatabase.update(game);
    await gameSocket.broadcastToGame({
      type: "set_game",
      data: { game: game },
    });

    return successResponse("Action received");
  }
);
