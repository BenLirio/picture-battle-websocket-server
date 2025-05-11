import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const successResponse = (message: string = "Success") => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message }),
  };
};

export const errorResponse = (message: string) => {
  return {
    statusCode: 400,
    body: JSON.stringify({ message }),
  };
};

export const withErrorHandling = (
  handler: (
    event: APIGatewayProxyEvent,
    context: Context
  ) => Promise<APIGatewayProxyResult>
) => {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event, context);
    } catch (error) {
      console.error("Error in handler:", error);
      return errorResponse("An internal server error occurred.");
    }
  };
};
