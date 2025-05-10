import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import AWS from "aws-sdk";

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

export const echoHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Echo event:", event);

  const endpoint = process.env.IS_OFFLINE
    ? "http://localhost:3001"
    : "https://" +
      event.requestContext.domainName +
      "/" +
      event.requestContext.stage;
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: endpoint,
  });

  const connectionId = event.requestContext.connectionId;

  let messageData: string;
  try {
    const body = JSON.parse(event.body || "{}");
    messageData = body.data || "";
  } catch (err) {
    console.error("Failed to parse message body", err);
    return {
      statusCode: 400,
      body: "Invalid message format",
    };
  }

  const responseMessage = "from server: " + messageData;

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
