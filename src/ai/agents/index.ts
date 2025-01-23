import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { model } from "../llm-model";

export class Agent {
  async processMessages(messages: BaseMessage[]) {
    // Convert messages to a string format the model can understand
    const messageText = messages
      .map(msg => msg.content)
      .join("\n");
    
    return await model.invoke(messageText);
  }
}

export const agent = new Agent();
