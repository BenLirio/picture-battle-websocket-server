// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";

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
