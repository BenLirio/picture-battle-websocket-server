import AWS from "aws-sdk";
import { Connection, ConnectionSchema } from "../schemas/connectionSchema";

const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONNECTION_TABLE_NAME!;

const createConnection = async (connection: Connection): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Item: connection,
  };
  await ddb.put(params).promise();
};

const getConnection = async (
  connectionId: string
): Promise<Connection | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: connectionId },
  };
  const result = await ddb.get(params).promise();
  if (!result.Item) {
    return null;
  }
  const parseResult = ConnectionSchema.safeParse(result.Item);
  if (!parseResult.success) {
    throw new Error("Invalid connection data retrieved from database");
  }
  return parseResult.data;
};

const listConnectionIds = async (): Promise<string[]> => {
  const params = {
    TableName: TABLE_NAME,
    ProjectionExpression: "id",
  };
  const result = await ddb.scan(params).promise();
  if (!result.Items) {
    return [];
  }
  return result.Items.map((item) => item.id);
};

const deleteConnection = async (connectionId: string): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: connectionId },
  };
  await ddb.delete(params).promise();
};

export const connectionDatabase = {
  createConnection,
  getConnection,
  listConnectionIds,
  deleteConnection,
};
