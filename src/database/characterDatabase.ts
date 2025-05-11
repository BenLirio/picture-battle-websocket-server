import { Character, characterSchema } from "../schemas/characterSchema";
import { DatabaseClient } from "./common";

const characterDatabase = new DatabaseClient<Character>(
  process.env.CONNECTION_TABLE_NAME!,
  characterSchema
);

export { characterDatabase };
