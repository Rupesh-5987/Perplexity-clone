import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export function getEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001", // NOT text-embedding-004, that 404s
  });
}
