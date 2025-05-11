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
import { Game } from "../schemas/gameSchema";
import { v4 as uuidv4 } from "uuid";
import { gameDatabase } from "../database/gameDatabase";
import { connectionDatabase } from "../database/connectionDatabase";
import { sendMessageToClient } from "../utils/messageUtils";

export const createGameHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    const game: Game = {
      id: uuidv4(),
      playerIds: [],
      state: "WAITING_FOR_PLAYERS",
      settings: {
        maxPlayers: 2,
      },
      characters: [],
    };
    await gameDatabase.create(game);
    const connectionIds = await connectionDatabase.listIds();
    console.log(`Connection IDs: ${connectionIds}`);

    for (const connectionId of connectionIds) {
      await sendMessageToClient(event, connectionId, {
        type: "game_created",
        gameId: game.id,
      });
    }

    return successResponse("Game created successfully.");
  }
);
