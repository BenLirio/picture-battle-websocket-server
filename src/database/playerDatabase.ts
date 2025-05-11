import AWS from "aws-sdk";
import { Player, PlayerSchema } from "../schemas/playerSchema";

const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PLAYER_TABLE_NAME!;

const createPlayer = async (player: Player): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Item: player,
  };
  await ddb.put(params).promise();
};

const getPlayer = async (playerId: string): Promise<Player | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: playerId },
  };
  const result = await ddb.get(params).promise();
  if (!result.Item) {
    return null;
  }
  const parseResult = PlayerSchema.safeParse(result.Item);
  if (!parseResult.success) {
    throw new Error("Invalid player data retrieved from database");
  }
  return parseResult.data;
};

const listPlayerIds = async (): Promise<string[]> => {
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

const deletePlayer = async (playerId: string): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: playerId },
  };
  await ddb.delete(params).promise();
};

export const playerDatabase = {
  createPlayer,
  getPlayer,
  listPlayerIds,
  deletePlayer,
};
