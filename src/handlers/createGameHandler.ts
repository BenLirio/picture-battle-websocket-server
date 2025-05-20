import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { successResponse, withErrorHandling } from "../utils/responseUtils";
import { Game } from "../schemas/gameSchema";
import { v4 as uuidv4 } from "uuid";
import { gameDatabase } from "../database/gameDatabase";
import { connectionDatabase } from "../database/connectionDatabase";
import { Socket } from "../connections/Socket";

export const createGameHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    const socket: Socket = new Socket(event);
    const game: Game = {
      id: uuidv4(),
      playerIds: [],
      state: "WAITING_FOR_PLAYERS",
      settings: {
        maxPlayers: 2,
      },
      characters: [],
      canAct: [],
      messages: [],
      actions: [],
    };
    await gameDatabase.create(game);
    await socket.broadcastToConnections({
      type: "game_created",
      gameId: game.id,
    });

    return successResponse("Game created successfully.");
  }
);
