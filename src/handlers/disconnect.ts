import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { successResponse, withErrorHandling } from "../utils/responseUtils";
import { connectionDatabase } from "../database/connectionDatabase";

export const disconnect = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
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
    return successResponse("Disconnected.");
  }
);
