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
import { sendMessageToClient } from "../utils/messageUtils";
import { characterDatabase } from "../database/characterDatabase";
import { v4 as uuidv4 } from "uuid";

const SelectCharacterRequestSchema = z.object({
  action: z.literal("selectCharacter"),
  data: z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
    playerToken: z.string().uuid(),
    characterName: z.string(),
  }),
});

export const selectCharacterHandler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    const {
      data: { gameId, playerId, playerToken, characterName },
    } = SelectCharacterRequestSchema.parse(JSON.parse(event.body!));

    const game = await gameDatabase.get(gameId);
    if (!game) {
      return errorResponse("Game not found.");
    }

    const player = await playerDatabase.get(playerId);
    if (!player) {
      return errorResponse("Player not found.");
    }

    if (player.token !== playerToken) {
      return errorResponse("Invalid player token.");
    }

    if (!game.playerIds.includes(playerId)) {
      return errorResponse("Player is not in this game.");
    }

    if (!game.canAct.includes(playerId)) {
      return errorResponse("Player is not allowed to act at this time.");
    }

    if (game.state !== "SELECTING_CHARACTERS") {
      return errorResponse("Game is not in the character selection state.");
    }

    // Check if the player has already selected a character
    const existingSelectionIndex = game.characters.findIndex(
      (char) => char.playerId === playerId
    );

    if (existingSelectionIndex !== -1) {
      return errorResponse(
        "Player has already selected a character for this game."
      );
    }

    // Create a new character
    const newCharacterId = uuidv4();
    const newCharacter = {
      id: newCharacterId,
      description: characterName,
    };

    await characterDatabase.create(newCharacter);

    // Add new selection
    game.characters.push({ playerId, characterId: newCharacterId });

    // Remove player from canAct after successful selection
    game.canAct = game.canAct.filter((id) => id !== playerId);

    // Check if all players have selected a character
    if (game.characters.length === game.playerIds.length) {
      game.state = "GAME_LOOP";
      // Add a random player to canAct
      const randomIndex = Math.floor(Math.random() * game.playerIds.length);
      game.canAct = [game.playerIds[randomIndex]];
    }

    await gameDatabase.update(game);

    // Send updated game state to all players in the game
    for (const pId of game.playerIds) {
      const gamePlayer = await playerDatabase.get(pId);
      if (gamePlayer) {
        for (const connId of gamePlayer.connectionIds) {
          await sendMessageToClient(event, connId, {
            type: "set_game",
            data: { game },
          });
        }
      }
    }

    return successResponse("Character selected successfully.");
  }
);
