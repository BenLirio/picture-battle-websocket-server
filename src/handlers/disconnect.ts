import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const disconnect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Disconnect event requestContext:", event.requestContext);
  return {
    statusCode: 200,
    body: "Disconnected.",
  };
};
