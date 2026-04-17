interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  score: number;
}

console.log('Initializing search tool with API key:', process.env.TAVILY_API_KEY?.slice(0, 5) + '...');

if (!process.env.TAVILY_API_KEY) {
  console.error('TAVILY_API_KEY is not set in environment variables');
  throw new Error('TAVILY_API_KEY is required but not set in environment variables');
}

const runSearch = async (input: string): Promise<SearchResult[]> => {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: input,
      max_results: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily request failed with status ${response.status}`);
  }

  const resultsData = await response.json();
  const searchResults = Array.isArray(resultsData) ? resultsData :
    resultsData?.results || resultsData?.data?.results || [];

  if (!searchResults.length) {
    return [{
      title: "No results found",
      snippet: "No matching results were found for your query.",
      url: "",
      score: 0
    }];
  }

  return searchResults.map((result: TavilyResult) => ({
    title: result.title || "Untitled",
    snippet: result.content || result.raw_content || "No content available",
    url: result.url || "",
    score: result.score || 0
  }));
};

export const searchTool = {
  invoke: runSearch,
  call: runSearch
};

// Verify the API key is working
(async () => {
  try {
    console.log('Testing Tavily search connection...');
    await searchTool.call("test");
    console.log('Successfully connected to Tavily search');
  } catch (error) {
    console.error('Failed to initialize Tavily search:', error);
    throw new Error('Failed to initialize Tavily search tool');
  }
})();

// Wrap the original invoke to handle response formatting
const originalInvoke = searchTool.invoke.bind(searchTool);
searchTool.invoke = async (input: string): Promise<SearchResult[]> => {
  console.log('searchTool.invoke: Starting search with input:', input);
  try {
    console.log('searchTool.invoke: Calling Tavily API');
    const results = await originalInvoke(input);
    console.log('searchTool.invoke: Received raw results:', results);
    
    // Tavily API returns an object with a results array
    const resultsData = typeof results === 'string' ? JSON.parse(results) : results;
    console.log('searchTool.invoke: Parsed results:', resultsData);

    // Extract the results array from the response
    const searchResults = Array.isArray(resultsData) ? resultsData : 
                         resultsData?.results || resultsData?.data?.results || [];
    
    console.log('searchTool.invoke: Extracted search results:', searchResults);
    
    if (!searchResults.length) {
      console.log('searchTool.invoke: No results found');
      return [{
        title: "No results found",
        snippet: "No matching results were found for your query.",
        url: "",
        score: 0
      }];
    }

    const formattedResults = searchResults.map((result: TavilyResult) => ({
      title: result.title || "Untitled",
      snippet: result.content || result.raw_content || "No content available",
      url: result.url || "",
      score: result.score || 0
    }));
    
    console.log('searchTool.invoke: Formatted results:', formattedResults);
    return formattedResults;
  } catch (error) {
    console.error('Search tool error:', error);
    throw new Error(error instanceof Error ? error.message : 'Search failed');
  }
};
