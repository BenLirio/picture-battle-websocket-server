import { DatabaseClient } from "./common";
import { Connection, ConnectionSchema } from "../schemas/connectionSchema";

const connectionDatabase = new DatabaseClient<Connection>(
  process.env.CONNECTION_TABLE_NAME!,
  ConnectionSchema
);

export { connectionDatabase };
