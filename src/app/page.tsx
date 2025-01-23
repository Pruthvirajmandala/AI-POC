"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Message {
  type: "request" | "response";
  content: string;
  summary?: string;
  timestamp: string;
  metadata?: {
    resultCount: number;
    sources: string[];
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    console.log('Messages state updated:', messages);
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      type: "request",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const result = await response.json();
      console.log('Frontend received response:', result);

      if (!response.ok) {
        console.error('Response not OK:', result.error);
        throw new Error(result.error?.message || 'Failed to fetch response');
      }
      
      if (!result.data || typeof result.data.content !== 'string') {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format');
      }

      console.log('Creating response message with:', result.data);
      const responseMessage: Message = {
        type: "response",
        content: result.data.content,
        summary: result.data.summary,
        metadata: result.data.metadata,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setMessages((prev) => {
        console.log('Previous messages:', prev);
        const newMessages = [...prev, responseMessage];
        console.log('New messages:', newMessages);
        return newMessages;
      });
    } catch (error) {
      const errorMessage: Message = {
        type: "response",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-32 relative">
                <Image
                  src="/next.svg"
                  alt="Logo"
                  fill
                  className="dark:invert object-contain"
                  priority
                />
              </div>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">AI Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg min-h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4" ref={containerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "request" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === "request"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.summary && message.type === "response" && (
                    <div className="mb-2 p-2 bg-gray-200 rounded text-sm font-medium text-gray-700">
                      {message.summary}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your request here..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
