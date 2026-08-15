import { ChatGroq } from "@langchain/groq";

// NOT a lazy singleton on purpose — constructing inside a function call
// (never at module top-level) is enough to dodge the dotenv/ESM ordering bug,
// and it lets every call pick its own temperature.
export function getLLM(temperature = 0.4) {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature,
  });
}
