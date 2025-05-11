import { DatabaseClient } from "./common";
import { Game, GameSchema } from "../schemas/gameSchema";

const gameDatabase = new DatabaseClient<Game>(
  process.env.GAME_TABLE_NAME!,
  GameSchema
);

export { gameDatabase };
