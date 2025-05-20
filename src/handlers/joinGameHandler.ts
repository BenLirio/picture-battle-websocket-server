import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "../utils/responseUtils";
import { z } from "zod";
import { gameDatabase } from "../database/gameDatabase";
import { playerDatabase } from "../database/playerDatabase";
import { connectionDatabase } from "../database/connectionDatabase";
import { Socket } from "../connections/Socket";
import { GameSocket } from "../connections/GameSocket";
import { generateGameScene } from "../ai/mockAi";
import { complete } from "../ai/gemeni";

const JoinGameRequestSchema = z.object({
  action: z.literal("joinGame"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
  }),
});
type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;

export const joinGameHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const socket: Socket = new Socket(event);
    const connectionId = event.requestContext.connectionId!;
    const {
      data: { gameId, playerId, playerToken },
    } = JoinGameRequestSchema.parse(JSON.parse(event.body!));
    const game = await gameDatabase.get(gameId);
    if (!game) {
      return errorResponse("Game not found.");
    }
    const gameSocket: GameSocket = new GameSocket(event, game);

    const player = await playerDatabase.get(playerId);
    if (!player) {
      return errorResponse("Player not found.");
    }
    if (player.token !== playerToken) {
      return errorResponse("Invalid player token.");
    }
    if (!player.connectionIds.includes(connectionId)) {
      player.connectionIds.push(connectionId);
      await playerDatabase.update(player);
    }

    if (game.playerIds.includes(player.id)) {
      return errorResponse("Player already in game.");
    }
    if (game.state !== "WAITING_FOR_PLAYERS") {
      return errorResponse("Game is not in a state to join.");
    }

    // Add player to game
    game.playerIds.push(player.id);
    game.messages.push({
      from: game.id,
      message: `Player ${player.id} has joined.`,
      tags: ["info"],
    });
    await gameSocket.updateGame();

    const gameFull = game.playerIds.length === game.settings.maxPlayers;

    if (gameFull) {
      await socket.broadcastToConnections({
        type: "game_no_longer_available",
        gameId: game.id,
      });
      game.messages.push({
        from: game.id,
        message: `Game is now full.`,
        tags: ["info"],
      });
      game.state = "SELECTING_CHARACTERS";
      game.messages.push({
        from: game.id,
        message: "The Scene of the duel is...",
        tags: [],
      });
      await gameSocket.updateGame();
      // const scene = await complete(
      //   "Generate a scene for a duel between two characters in a game. The scene should be exciting and engaging, with a clear setting and atmosphere. Your answer should be a single sentence."
      // );
      const scene = await generateGameScene();
      game.messages.push({
        from: game.id,
        message: scene,
        tags: ["scene"],
      });
      game.messages.push({
        from: game.id,
        message: "select your character",
        tags: ["info"],
      });
      game.canAct = [...game.playerIds];
      await gameSocket.updateGame();
    }

    await gameDatabase.update(game);

    return successResponse("Game joined successfully.");
  }
);
