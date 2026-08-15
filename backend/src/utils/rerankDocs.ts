import { RunnableLambda } from "@langchain/core/runnables";
import { getEmbeddings } from "../lib/gemini.js";
import { cosineSimilarity } from "./computeSimilarity.js";
import type { SearxngResult } from "../services/searxng.js";

// Shared math, reused (not rewritten) across every Group A agent, per
// section 1.2's instruction. Embed docs + query in parallel, cosine
// similarity, filter > 0.5, sort DESCENDING (most similar first), slice 15.
export const rerankDocs = RunnableLambda.from(
  async (input: { query: string; docs: SearxngResult[] }) => {
    if (input.docs.length === 0) return [];
    const embeddings = getEmbeddings();
    const [queryEmbedding, docEmbeddings] = await Promise.all([
      embeddings.embedQuery(input.query),
      embeddings.embedDocuments(input.docs.map((d) => d.content || "")),
    ]);

    return input.docs
      .map((doc, i) => ({
        doc,
        score: cosineSimilarity(queryEmbedding, docEmbeddings[i]),
      }))
      .filter((r) => r.score > 0.5)
      .sort((a, b) => b.score - a.score) // descending — most similar first
      .slice(0, 15)
      .map((r) => r.doc);
  }
);

export const processDocs = RunnableLambda.from((docs: SearxngResult[]) => {
  if (docs.length === 0) return "No relevant sources were found.";
  return docs
    .map((d, i) => `${i + 1}. ${d.title}\n${d.content}\nURL: ${d.url}`)
    .join("\n\n");
});
