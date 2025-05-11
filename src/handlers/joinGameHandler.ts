import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { z } from "zod";
import { gameDatabase } from "../database/gameDatabase";
import { playerDatabase } from "../database/playerDatabase";
import { connectionDatabase } from "../database/connectionDatabase";
import { getApiGatewayManagementApi } from "../utils/echoUtils";

const JoinGameRequestSchema = z.object({
  action: z.literal("joinGame"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
  }),
});
type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;

export const joinGameHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const {
    data: { gameId, playerId, playerToken },
  } = JoinGameRequestSchema.parse(JSON.parse(event.body!));
  const game = await gameDatabase.get(gameId);
  if (!game) {
    return {
      statusCode: 400,
      body: "Game not found.",
    };
  }
  const player = await playerDatabase.get(playerId);
  if (!player) {
    return {
      statusCode: 400,
      body: "Player not found.",
    };
  }
  if (player.token !== playerToken) {
    return {
      statusCode: 400,
      body: "Invalid player token.",
    };
  }
  if (!player.connectionIds.includes(connectionId)) {
    player.connectionIds.push(connectionId);
    await playerDatabase.update(player);
  }

  if (game.playerIds.includes(player.id)) {
    return {
      statusCode: 400,
      body: "Player already in game.",
    };
  }
  if (game.state !== "WAITING_FOR_PLAYERS") {
    return {
      statusCode: 400,
      body: "Game is not in a state to join.",
    };
  }

  game.playerIds.push(player.id);
  const apigwManagementApi = getApiGatewayManagementApi(event);
  if (game.settings.maxPlayers === game.playerIds.length) {
    game.state = "SELECTING_CHARACTERS";
    const connectionIds = await connectionDatabase.listIds();
    await Promise.all(
      connectionIds.map(async (connectionId) => {
        try {
          await apigwManagementApi
            .postToConnection({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                type: "game_no_longer_available",
                gameId: game.id,
              }),
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
              `Failed to send game_no_longer_available event to connectionId: ${connectionId}`,
              error
            );
          }
        }
      })
    );
  }
  await Promise.all(
    game.playerIds.map(async (playerId) => {
      const player = await playerDatabase.get(playerId);
      if (player) {
        await Promise.all(
          player.connectionIds.map(async (connectionId) => {
            try {
              await apigwManagementApi
                .postToConnection({
                  ConnectionId: connectionId,
                  Data: JSON.stringify({
                    type: "set_game",
                    data: { game: game },
                  }),
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
                  `Failed to send set_game event to connectionId: ${connectionId}`,
                  error
                );
              }
            }
          })
        );
      }
    })
  );
  await gameDatabase.update(game);

  return {
    statusCode: 200,
    body: "Game joined successfully.",
  };
};
