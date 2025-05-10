import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const connect = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Connect event requestContext:", event.requestContext);
  return {
    statusCode: 200,
    body: "Connected.",
  };
};
