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

  async listIds(filter?: {
    attributeName: string;
    condition: "Equal to" | "Not Equal to";
    type: "String" | "Number";
    value: string;
  }): Promise<string[]> {
    let params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: this.tableName,
      ProjectionExpression: "id",
    };

    if (filter) {
      const attributePlaceholder = "#attr";
      const valuePlaceholder = ":val";

      let operator = "=";
      if (filter.condition === "Not Equal to") {
        operator = "<>";
      }

      let value: any = filter.value;
      if (filter.type === "Number") {
        value = Number(filter.value);
      }

      params = {
        ...params,
        FilterExpression: `${attributePlaceholder} ${operator} ${valuePlaceholder}`,
        ExpressionAttributeNames: {
          [attributePlaceholder]: filter.attributeName,
        },
        ExpressionAttributeValues: {
          [valuePlaceholder]: value,
        },
      };
    }

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
