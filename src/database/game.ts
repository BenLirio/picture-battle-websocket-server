import AWS from "aws-sdk";
import { Game, GameSchema } from "../schemas/game";

const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.GAME_TABLE_NAME!;

const createGame = async (game: Game): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Item: game,
  };
  await ddb.put(params).promise();
};

const getGame = async (gameId: string): Promise<Game | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: gameId },
  };
  const result = await ddb.get(params).promise();
  if (!result.Item) {
    return null;
  }
  // Validate the retrieved item against the Game schema
  const parseResult = GameSchema.safeParse(result.Item);
  if (!parseResult.success) {
    throw new Error("Invalid game data retrieved from database");
  }
  return parseResult.data;
};

const listGameIds = async (): Promise<string[]> => {
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

export const gameDatabase = {
  createGame,
  getGame,
  listGameIds,
};
