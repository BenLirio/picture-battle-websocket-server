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
