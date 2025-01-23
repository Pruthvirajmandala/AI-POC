import { ChatOllama } from "@langchain/ollama";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { ChatOllamaCallOptions } from "@langchain/ollama";

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

export const llm = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "llama2",
  temperature: 0,
});

export type Runnable<
  I extends BaseLanguageModelInput = BaseLanguageModelInput,
  O extends ModelResponse = ModelResponse,
  CallOptions extends ChatOllamaCallOptions = ChatOllamaCallOptions
> = {
  invoke: (input: I, options?: CallOptions) => Promise<O>;
};
