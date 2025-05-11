import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { connectionDatabase } from "../database/connectionDatabase";
import { Connection } from "../schemas/connectionSchema";

export const connect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Connect event requestContext:", event.requestContext);
  const connectionId = event.requestContext.connectionId!;
  const connection: Connection = {
    id: connectionId,
    createdAt: new Date().toISOString(),
  };
  await connectionDatabase.createConnection(connection);
  return {
    statusCode: 200,
    body: "Connected.",
  };
};
