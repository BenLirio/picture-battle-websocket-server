import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { Game } from "../schemas/gameSchema";
import { v4 as uuidv4 } from "uuid";
import { gameDatabase } from "../database/gameDatabase";
import { getApiGatewayManagementApi } from "../utils/echoUtils";
import { connectionDatabase } from "../database/connectionDatabase";

export const createGameHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const game: Game = {
    id: uuidv4(),
    playerIds: [],
    state: "WAITING_FOR_PLAYERS",
  };
  await gameDatabase.createGame(game);
  const apigwManagementApi = getApiGatewayManagementApi(event);
  const connectionIds = await connectionDatabase.listConnectionIds();
  console.log(`Connection IDs: ${connectionIds}`);

  await Promise.all(
    connectionIds.map(async (connectionId) => {
      console.log(
        `Sending game_created event to connectionId: ${connectionId}`
      );
      try {
        await apigwManagementApi
          .postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({
              type: "game_created",
              gameId: game.id,
            }),
          })
          .promise();
        console.log(
          `Successfully sent game_created event to connectionId: ${connectionId}`
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log(
            `Connection ${connectionId} is stale and has been deleted.`
          );
          await connectionDatabase.deleteConnection(connectionId);
        } else {
          console.error(
            `Failed to send game_created event to connectionId: ${connectionId}`,
            error
          );
        }
      }
    })
  );

  return {
    statusCode: 200,
    body: "Game created successfully.",
  };
};
