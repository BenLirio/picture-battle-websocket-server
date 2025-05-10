import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { connectionDatabase } from "../database/connection";

export const connect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Connect event requestContext:", event.requestContext);
  await connectionDatabase.createConnection({
    id: event.requestContext.connectionId!,
    createdAt: new Date().toISOString(),
  });
  return {
    statusCode: 200,
    body: "Connected.",
  };
};
