import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { successResponse, withErrorHandling } from "../utils/responseUtils";
import { connectionDatabase } from "../database/connectionDatabase";
import { Connection } from "../schemas/connectionSchema";

export const connect = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    const connection: Connection = {
      id: connectionId,
      createdAt: new Date().toISOString(),
    };
    await connectionDatabase.create(connection);
    return successResponse("Connected.");
  }
);
