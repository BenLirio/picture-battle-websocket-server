import { DatabaseClient } from "./common";
import { Player, PlayerSchema } from "../schemas/playerSchema";

const playerDatabase = new DatabaseClient<Player>(
  process.env.PLAYER_TABLE_NAME!,
  PlayerSchema
);

export { playerDatabase };
