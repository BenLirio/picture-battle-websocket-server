import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { connectionDatabase } from "../database/connectionDatabase";
import { Connection } from "../schemas/connectionSchema";
import { gameDatabase } from "../database/gameDatabase";
import {
  getApiGatewayManagementApi,
  RESPONSE_MESSAGE_PREFIX,
} from "../utils/echoUtils";
import { playerDatabase } from "../database/playerDatabase";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../schemas/playerSchema";

export const initHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const player: Player = {
    id: uuidv4(),
    connectionIds: [connectionId],
  };
  await playerDatabase.createPlayer(player);
  const gameIds = await gameDatabase.listGameIds();

  const apigwManagementApi = getApiGatewayManagementApi(event);

  await apigwManagementApi
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        type: "set_player_id",
        data: {
          playerId: player.id,
        },
      }),
    })
    .promise();

  await apigwManagementApi
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        type: "game_ids",
        data: {
          gameIds,
        },
      }),
    })
    .promise();

  return {
    statusCode: 200,
    body: "Connected.",
  };
};
