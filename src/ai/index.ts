import { model } from "./llm-model";

interface ModelResponse {
  content: string;
  metadata: {
    resultCount: number;
  };
}

class RunnableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RunnableError';
  }
}

export async function startRunnable(message: string): Promise<ModelResponse> {
  console.log('startRunnable: Starting with message:', message);
  
  if (!message.trim()) {
    console.log('startRunnable: Empty message detected');
    throw new RunnableError('Message cannot be empty');
  }

  try {
    console.log('startRunnable: Invoking model');
    const response = await model.invoke(message);
    console.log('startRunnable: Received model response:', response);
    
    // Validate response structure
    if (!response || typeof response.content !== 'string' || !response.metadata) {
      console.log('startRunnable: Invalid response format:', response);
      throw new RunnableError('Invalid response format from model');
    }

    return response;
  } catch (error) {
    console.error("Error in startRunnable:", error);
    if (error instanceof RunnableError) {
      throw error;
    }
    throw new RunnableError('Failed to process message', error);
  }
}
