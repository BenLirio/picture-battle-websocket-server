import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { connectionDatabase } from "../database/connectionDatabase";

export const disconnect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Disconnect event requestContext:", event.requestContext);
  const connectionId = event.requestContext.connectionId;
  if (connectionId) {
    try {
      await connectionDatabase.delete(connectionId);
      console.log(`Deleted connection with id: ${connectionId}`);
    } catch (error) {
      console.error(
        `Error deleting connection with id ${connectionId}:`,
        error
      );
    }
  }
  return {
    statusCode: 200,
    body: "Disconnected.",
  };
};
