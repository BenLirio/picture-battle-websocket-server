import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { z } from "zod";
import { gameDatabase } from "../database/gameDatabase";
import { playerDatabase } from "../database/playerDatabase";

const JoinGameRequestSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
});
type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;

export const joinGameHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { gameId, playerId } = JoinGameRequestSchema.parse(
    JSON.parse(event.body!)
  );
  const player = await playerDatabase.get(playerId);
  if (!player) {
    return {
      statusCode: 400,
      body: "Player not found.",
    };
  }

  const game = await gameDatabase.get(gameId);

  return {
    statusCode: 200,
    body: "Game joined successfully.",
  };
};
