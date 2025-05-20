// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Schema } from "@google/genai";
import { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export const complete = async (input: string) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseMimeType: "text/plain",
  };
  const model = "gemini-2.5-flash-preview-04-17";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: input,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let outputText = "";
  for await (const chunk of response) {
    if (chunk.text) {
      outputText += chunk.text;
    }
  }
  return outputText;
};

export const completeConversation = async (
  input: {
    role: "user" | "model";
    text: string;
  }[]
) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseMimeType: "text/plain",
    systemInstructions: [
      {
        text: `You are a Duel Adjudicator and Game Master. Your role is to:
1.  Receive player actions.
2.  Determine the success or failure of these actions.
3.  Narrate the outcomes in a **concise, engaging, and strictly third-person perspective.**
4.  Ensure descriptions are vivid but **brief (typically 1-2 sentences)**.
5.  Maintain fairness and impartiality.
`,
      },
    ],
  };
  const model = "gemini-2.5-flash-preview-04-17";
  const contents = input.map(({ role, text }) => ({
    role,
    parts: [
      {
        text,
      },
    ],
  }));
  console.log(JSON.stringify(contents, null, 2));

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let outputText = "";
  for await (const chunk of response) {
    outputText += chunk.text;
  }
  return outputText;
};

export const structuredComplete = async <T>(
  text: string,
  responseSchema: Schema
) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text,
          },
        ],
      },
    ],
  });
  return (await JSON.parse(response.text!)) as T;
};
