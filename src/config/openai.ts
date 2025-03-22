
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

export async function createEmbedding({ model, input }: { model: string; input: string }) {
  return await openai.embeddings.create({
    input: input,
    model: model,
  });
}

export async function createEmbeddingToQueryPinecone({query}: {query: string}) {
  const embeddingResponse = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL!,
    input: query,
  });
  return embeddingResponse.data[0].embedding;
}

export default openai;
