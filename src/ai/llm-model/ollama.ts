import { ChatOllama } from "@langchain/ollama";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { ChatOllamaCallOptions } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

// Shared interfaces for consistent typing across the application
export interface ModelResponse {
  content: string;
  metadata: {
    resultCount: number;
    sources: string[];
  };
}

export interface ModelError extends Error {
  name: string;
  message: string;
  cause?: unknown;
}

// Create a fallback chain of LLMs
const createLLM = () => {
  // Use Ollama if available (development)
  if (process.env.OLLAMA_BASE_URL) {
    console.log("Using Ollama LLM");
    return new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL,
      model: "llama2",
      temperature: 0,
    });
  }

  // Fallback to OpenAI (production)
  console.log("Using OpenAI LLM");
  return new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });
};

export const llm = createLLM();

export type Runnable<
  I extends BaseLanguageModelInput = BaseLanguageModelInput,
  O extends ModelResponse = ModelResponse,
  CallOptions extends ChatOllamaCallOptions = ChatOllamaCallOptions
> = {
  invoke: (input: I, options?: CallOptions) => Promise<O>;
};
