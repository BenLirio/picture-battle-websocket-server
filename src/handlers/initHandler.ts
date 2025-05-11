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
import { gameDatabase } from "../database/gameDatabase";
import { playerDatabase } from "../database/playerDatabase";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../schemas/playerSchema";
import { sendMessageToClient } from "../utils/messageUtils";

export const initHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    const player: Player = {
      id: uuidv4(),
      connectionIds: [connectionId],
      token: uuidv4(),
    };
    await playerDatabase.create(player);
    const gameIds = await gameDatabase.listIds({
      attributeName: "state",
      condition: "Equal to",
      type: "String",
      value: "WAITING_FOR_PLAYERS",
    });

    await sendMessageToClient(event, connectionId, {
      type: "set_player",
      data: {
        playerId: player.id,
        token: player.token,
      },
    });

    await sendMessageToClient(event, connectionId, {
      type: "game_ids",
      data: {
        gameIds,
      },
    });

    return successResponse("Connected.");
  }
);
