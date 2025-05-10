import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { Game } from "../schemas/game";
import { v4 as uuidv4 } from "uuid";
import { gameDatabase } from "../database/game";

export const createGameHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const game: Game = {
    id: uuidv4(),
    playerIds: [],
    state: "WAITING_FOR_PLAYERS",
  };
  await gameDatabase.createGame(game);
  // send message to all connected clients
  return {
    statusCode: 200,
    body: "Game created successfully.",
  };
};
