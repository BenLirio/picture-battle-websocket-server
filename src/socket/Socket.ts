import { APIGatewayProxyEvent } from "aws-lambda";
import { getApiGatewayManagementApi } from "../utils/messageUtils";
import { connectionDatabase } from "../database";

export class Socket {
  private apiGatewayManagementApi: AWS.ApiGatewayManagementApi;

  constructor(event: APIGatewayProxyEvent) {
    this.apiGatewayManagementApi = getApiGatewayManagementApi(event);
  }

  public async sendMessage(connectionId: string, data: any): Promise<void> {
    try {
      await this.apiGatewayManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(data),
        })
        .promise();
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log(
          `Connection ${connectionId} is stale and has been deleted.`
        );
        await connectionDatabase.delete(connectionId);
      } else {
        console.error(
          `Failed to send message to connectionId: ${connectionId}`,
          error
        );
        throw error;
      }
    }
  }
}
