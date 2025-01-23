import { searchTool } from "../tools/searchTool";
import { llm } from "./ollama";
import { HumanMessage } from "@langchain/core/messages";

interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
  score?: number;
}

interface ModelResponse {
  content: string;
  metadata: {
    resultCount: number;
  };
}

class SearchError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SearchError';
  }
}

const generatePrompt = (query: string, searchResults: SearchResult[]): string => {
  if (!searchResults || searchResults.length === 0) {
    return `No search results found for the query: "${query}". Please provide a response indicating that no information was found.`;
  }

  if (searchResults.length === 1 && searchResults[0].title === "No results found") {
    return `No relevant information found for the query: "${query}". Please provide a response indicating that no information was found.`;
  }

  const context = searchResults.map((result, index) => {
    return `Source ${index + 1}:
Title: ${result.title || 'No Title'}
Content: ${result.snippet || 'No content available'}
URL: ${result.url || 'N/A'}
---`;
  }).join('\n');

  return `Query: "${query}"

Search Results:
${context}

Instructions:
1. Analyze all provided search results
2. Synthesize the information into a comprehensive response
3. Focus on accuracy and relevance to the query
4. Include key facts and insights from multiple sources where applicable
5. Maintain a clear and engaging writing style
6. Only use information from the provided sources

Please provide your response:`;
};

const handleSearchError = (error: unknown): never => {
  console.error('Search error:', error);
  if (error instanceof SearchError) {
    throw error;
  }
  throw new SearchError('Failed to perform search', error);
};

const validateSearchResults = (results: unknown): SearchResult[] => {
  if (!results || !Array.isArray(results)) {
    console.error('Invalid results format:', results);
    throw new SearchError('Invalid search results format');
  }
  return results;
};

export const model = {
  invoke: async (input: string): Promise<ModelResponse> => {
    console.log('model.invoke: Starting with input:', input);
    
    if (!input.trim()) {
      console.log('model.invoke: Empty input detected');
      throw new SearchError('Search query cannot be empty');
    }

    try {
      // Get search results from Tavily
      console.log('model.invoke: Invoking search tool');
      const searchResults = validateSearchResults(
        await searchTool.invoke(input).catch(handleSearchError)
      );
      console.log('model.invoke: Received search results:', JSON.stringify(searchResults, null, 2));

      // Generate prompt with search results
      const prompt = generatePrompt(input, searchResults);
      console.log('model.invoke: Generated prompt:', prompt);

      // Get response from Ollama
      const ollamaResponse = await llm.invoke([new HumanMessage(prompt)]);
      console.log('model.invoke: Received Ollama response:', ollamaResponse);

      // Convert complex content to string if needed
      const content = typeof ollamaResponse.content === 'string' 
        ? ollamaResponse.content 
        : JSON.stringify(ollamaResponse.content);

      // Format the response with metadata
      const response: ModelResponse = {
        content,
        metadata: {
          resultCount: searchResults.length
        }
      };

      console.log('model.invoke: Final formatted response:', response);
      return response;
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      throw new SearchError('Failed to perform search', error);
    }
  }
};
