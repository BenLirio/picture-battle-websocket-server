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
import { characterDatabase } from "../database/characterDatabase";
import { v4 as uuidv4 } from "uuid";
import { Socket } from "../connections/Socket";
import { GameSocket } from "../connections/GameSocket";
import { generateGameScene } from "../ai/mockAi";

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
    const socket: Socket = new Socket(event);

    const game = await gameDatabase.get(gameId);
    if (!game) {
      return errorResponse("Game not found.");
    }
    const gameSocket = new GameSocket(event, game);

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
    game.messages.push({
      from: game.id,
      message: `Player ${playerId} has selected character "${characterName}".`,
    });

    // Add new selection
    game.characters.push({ playerId, characterId: newCharacterId });

    // Remove player from canAct after successful selection
    game.canAct = game.canAct.filter((id) => id !== playerId);

    // Check if all players have selected a character
    const inGameLoop = game.characters.length === game.playerIds.length;
    if (inGameLoop) {
      game.state = "GAME_LOOP";
      game.messages.push({
        from: game.id,
        message:
          "All players have selected their characters. The game is starting...",
      });
      const randomIndex = Math.floor(Math.random() * game.playerIds.length);
      game.canAct = [game.playerIds[randomIndex]];
    }

    await gameDatabase.update(game);
    await gameSocket.broadcastToGame({
      type: "set_game",
      data: { game },
    });

    return successResponse("Character selected successfully.");
  }
);
