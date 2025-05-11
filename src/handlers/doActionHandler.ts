import { APIGatewayEvent } from "aws-lambda";
import { gameDatabase, playerDatabase, connectionDatabase } from "../database";
import { sendMessageToClient } from "../utils/messageUtils";
import { successResponse, errorResponse } from "../utils/responseUtils";
import { z } from "zod";

const DoActionInputSchema = z.object({
  action: z.literal("doAction"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
    action: z.string(),
  }),
});

export const doActionHandler = async (event: APIGatewayEvent) => {
  const {
    data: { gameId, playerId, playerToken, action },
  } = DoActionInputSchema.parse(JSON.parse(event.body!));
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    console.error("No connectionId in event");
    return errorResponse("Internal server error");
  }

  try {
    // Verify game exists
    const game = await gameDatabase.get(gameId);
    if (!game) {
      await sendMessageToClient(event, connectionId, {
        action: "error",
        message: "Game not found",
      });
      return errorResponse("Game not found");
    }

    // Verify player exists
    const player = await playerDatabase.get(playerId);
    if (!player) {
      await sendMessageToClient(event, connectionId, {
        action: "error",
        message: "Player not found",
      });
      return errorResponse("Player not found");
    }

    // Verify player token matches
    if (player.token !== playerToken) {
      await sendMessageToClient(event, connectionId, {
        action: "error",
        message: "Invalid player token",
      });
      return errorResponse("Invalid player token");
    }

    // Verify player is in the game
    if (!game.playerIds.includes(playerId)) {
      await sendMessageToClient(event, connectionId, {
        action: "error",
        message: "Player is not in this game",
      });
      return errorResponse("Player is not in this game");
    }

    // Verify player is in the canAct list
    if (!game.canAct.includes(playerId)) {
      await sendMessageToClient(event, connectionId, {
        action: "error",
        message: "It is not your turn to act",
      });
      return errorResponse("It is not your turn to act");
    }

    console.log("Performing action:", action);

    // Increment turn
    if (game.settings.maxPlayers !== 2 || game.playerIds.length !== 2) {
      return errorResponse("Invalid game state for action");
    }
    const nextPlayerId = game.playerIds.find((id) => id !== playerId)!;
    game.canAct = [nextPlayerId];
    await gameDatabase.update(game);
    for (const playerId of game.playerIds) {
      const player = await playerDatabase.get(playerId);
      if (player) {
        for (const connectionId of player.connectionIds) {
          await sendMessageToClient(event, connectionId, {
            type: "set_game",
            data: { game: game },
          });
        }
      }
    }

    // Update game state with the next player's turn
    // This part needs actual game state update logic, for now just console log
    console.log(`Incrementing turn. Next player to act: ${nextPlayerId}`);

    // TODO: Implement action performance logic here

    // For now, just send a success message back
    await sendMessageToClient(event, connectionId, {
      action: "actionPerformed",
      message:
        "Action received and turn incremented (action not fully implemented)",
    });

    return successResponse("Action received");
  } catch (error) {
    console.error("Error performing action:", error);
    await sendMessageToClient(event, connectionId, {
      action: "error",
      message: "Error performing action",
    });
    return errorResponse("Error performing action");
  }
};
