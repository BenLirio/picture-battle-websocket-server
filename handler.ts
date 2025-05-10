import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const connect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Connect event:", event);
  return {
    statusCode: 200,
    body: "Connected.",
  };
};

export const disconnect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Disconnect event:", event);
  return {
    statusCode: 200,
    body: "Disconnected.",
  };
};

export const defaultHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Default event:", event);
  return {
    statusCode: 200,
    body: "Default route.",
  };
};
