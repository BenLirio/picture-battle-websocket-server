import { playerDatabase } from "../database";
import { Game } from "../schemas/gameSchema";
import { Socket } from "./Socket";

export class GameSocket {
  private socket: Socket;
  private game: Game;

  constructor(event: AWSLambda.APIGatewayEvent, game: Game) {
    this.socket = new Socket(event);
    this.game = game;
  }

  public async broadcastToGame(message: any) {
    await Promise.all(
      this.game.playerIds.map(async (playerId) => {
        const player = await playerDatabase.get(playerId);
        if (player) {
          await Promise.all(
            player.connectionIds.map(async (connectionId) => {
              await this.socket.sendMessage(connectionId, message);
            })
          );
        }
      })
    );
  }
}
