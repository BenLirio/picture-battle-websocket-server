import { Action, ActionSchema } from "../schemas/actionSchema";
import { DatabaseClient } from "./common";

const actionDatabase = new DatabaseClient<Action>(
  process.env.ACTION_TABLE_NAME!,
  ActionSchema
);

export { actionDatabase };
