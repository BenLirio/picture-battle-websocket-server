import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { connectionDatabase } from "../database/connectionDatabase";
import { Connection } from "../schemas/connection";
import { gameDatabase } from "../database/gameDatabase";
import {
  getApiGatewayManagementApi,
  RESPONSE_MESSAGE_PREFIX,
} from "../utils/echoUtils";

export const initHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const gameIds = await gameDatabase.listGameIds();

  const apigwManagementApi = getApiGatewayManagementApi(event);

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
