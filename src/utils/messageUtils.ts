import AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { connectionDatabase } from "../database/connectionDatabase";

export const RESPONSE_MESSAGE_PREFIX = "from server: ";

export function getApiGatewayManagementApi(
  event: APIGatewayProxyEvent
): AWS.ApiGatewayManagementApi {
  const endpoint = process.env.IS_OFFLINE
    ? "http://localhost:3001"
    : "https://" +
      event.requestContext.domainName +
      "/" +
      event.requestContext.stage;

  return new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: endpoint,
  });
}

export const sendMessageToClient = async (
  event: APIGatewayProxyEvent,
  connectionId: string,
  data: any
) => {
  const apigwManagementApi = getApiGatewayManagementApi(event);
  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(data),
      })
      .promise();
    console.log(`Successfully sent message to connectionId: ${connectionId}`);
  } catch (error: any) {
    if (error.statusCode === 410) {
      console.log(`Connection ${connectionId} is stale and has been deleted.`);
      await connectionDatabase.delete(connectionId);
    } else {
      console.error(
        `Failed to send message to connectionId: ${connectionId}`,
        error
      );
    }
  }
};
