import AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";

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

export function parseMessageData(event: APIGatewayProxyEvent): string {
  try {
    const body = JSON.parse(event.body || "{}");
    return body.data || "";
  } catch (err) {
    throw new Error("Invalid message format");
  }
}
