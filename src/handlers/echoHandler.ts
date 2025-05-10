import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  getApiGatewayManagementApi,
  parseMessageData,
  RESPONSE_MESSAGE_PREFIX,
} from "../utils/echoUtils";

export const echoHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Echo event requestContext:", event.requestContext);
  console.log("Echo event body:", event.body);

  const apigwManagementApi = getApiGatewayManagementApi(event);

  const connectionId = event.requestContext.connectionId;

  let messageData: string;
  try {
    messageData = parseMessageData(event);
  } catch (err) {
    console.error("Failed to parse message body", err);
    return {
      statusCode: 400,
      body: "Invalid message format",
    };
  }

  const responseMessage = RESPONSE_MESSAGE_PREFIX + messageData;

  try {
    await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId!, Data: responseMessage })
      .promise();
  } catch (err) {
    console.error("Failed to post message", err);
    return {
      statusCode: 500,
      body: "Failed to send message",
    };
  }

  return {
    statusCode: 200,
    body: "Message sent",
  };
};
