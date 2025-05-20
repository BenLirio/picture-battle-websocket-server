import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI();

export const structuredOutputCompletion = async <T>(
  text: string,
  zodSchema: z.ZodSchema
) => {
  const completion = await openai.beta.chat.completions.parse({
    model: "o4-mini-2025-04-16",
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
    response_format: zodResponseFormat(zodSchema, "event"),
  });

  return completion.choices[0].message.parsed as T;
};
