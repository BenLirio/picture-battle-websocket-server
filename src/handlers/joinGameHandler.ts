import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "../utils/responseUtils";
import { z } from "zod";
import { gameDatabase } from "../database/gameDatabase";
import { playerDatabase } from "../database/playerDatabase";
import { connectionDatabase } from "../database/connectionDatabase";
import { Socket } from "../connections/Socket";

const JoinGameRequestSchema = z.object({
  action: z.literal("joinGame"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
  }),
});
type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;

export const joinGameHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const socket: Socket = new Socket(event);
    const connectionId = event.requestContext.connectionId!;
    const {
      data: { gameId, playerId, playerToken },
    } = JoinGameRequestSchema.parse(JSON.parse(event.body!));
    const game = await gameDatabase.get(gameId);
    if (!game) {
      return errorResponse("Game not found.");
    }
    const player = await playerDatabase.get(playerId);
    if (!player) {
      return errorResponse("Player not found.");
    }
    if (player.token !== playerToken) {
      return errorResponse("Invalid player token.");
    }
    if (!player.connectionIds.includes(connectionId)) {
      player.connectionIds.push(connectionId);
      await playerDatabase.update(player);
    }

    if (game.playerIds.includes(player.id)) {
      return errorResponse("Player already in game.");
    }
    if (game.state !== "WAITING_FOR_PLAYERS") {
      return errorResponse("Game is not in a state to join.");
    }

    game.playerIds.push(player.id);
    if (game.settings.maxPlayers === game.playerIds.length) {
      game.state = "SELECTING_CHARACTERS";
      game.canAct = [...game.playerIds]; // Add both player IDs to canAct
      const connectionIds = await connectionDatabase.listIds();
      for (const connectionId of connectionIds) {
        await socket.sendMessage(connectionId, {
          type: "game_no_longer_available",
          gameId: game.id,
        });
      }
    }
    for (const playerId of game.playerIds) {
      const player = await playerDatabase.get(playerId);
      if (player) {
        for (const connectionId of player.connectionIds) {
          await socket.sendMessage(connectionId, {
            type: "set_game",
            data: { game: game },
          });
        }
      }
    }
    await gameDatabase.update(game);

    return successResponse("Game joined successfully.");
  }
);
