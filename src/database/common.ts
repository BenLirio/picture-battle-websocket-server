import AWS from "aws-sdk";
import { z } from "zod";

export const ddb = new AWS.DynamoDB.DocumentClient();

export class DatabaseClient<T> {
  private tableName: string;
  private schema: z.ZodSchema<T>;

  constructor(tableName: string, schema: z.ZodSchema<T>) {
    this.tableName = tableName;
    this.schema = schema;
  }

  async create(item: T): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: item as AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap,
    };
    await ddb.put(params).promise();
  }

  async get(id: string): Promise<T | null> {
    const params = {
      TableName: this.tableName,
      Key: { id },
    };
    const result = await ddb.get(params).promise();
    if (!result.Item) {
      return null;
    }
    const parseResult = this.schema.safeParse(result.Item);
    if (!parseResult.success) {
      throw new Error(
        `Invalid data retrieved from database for table ${this.tableName}`
      );
    }
    return parseResult.data;
  }

  async listIds(): Promise<string[]> {
    const params = {
      TableName: this.tableName,
      ProjectionExpression: "id",
    };
    const result = await ddb.scan(params).promise();
    if (!result.Items) {
      return [];
    }
    return result.Items.map((item) => item.id);
  }

  async delete(id: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: { id },
    };
    await ddb.delete(params).promise();
  }
}
