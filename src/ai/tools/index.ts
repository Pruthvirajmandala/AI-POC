import { Tool } from "@langchain/core/tools";
import { searchTool } from "./searchTool";

// Export the search tool
export const tools: Tool[] = [searchTool];
export { searchTool };
