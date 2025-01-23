import { startRunnable } from "@/ai";
import { nanoid } from "nanoid";
import { z } from "zod";

const InputBodySchema = z.object({
  message: z.string().min(1),
  chatId: z.string().optional(),
});

type InputBodyType = z.infer<typeof InputBodySchema>;

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

interface SuccessResponse {
  data: {
    content: string;
    summary: string;
    metadata: {
      resultCount: number;
    };
    chatId: string;
  };
}

export const POST = async (req: Request): Promise<Response> => {
  console.log('API route: Received request');
  try {
    const body = await req.json();
    console.log('API route: Parsed request body:', body);
    
    const result = InputBodySchema.safeParse(body);
    if (!result.success) {
      console.log('API route: Validation failed:', result.error);
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: result.error.format(),
        },
      };
      return Response.json(errorResponse, { status: 400 });
    }

    const { message, chatId = nanoid() } = result.data;
    console.log('API route: Calling startRunnable with message:', message);
    const response = await startRunnable(message, chatId);
    console.log('API route: Received response from startRunnable:', response);

    if (!response || typeof response.content !== 'string') {
      console.error('API route: Invalid response format:', response);
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid response format from AI",
          code: "INVALID_RESPONSE",
          details: response,
        },
      };
      return Response.json(errorResponse, { status: 500 });
    }

    // Generate a summary (first sentence or up to 150 characters)
    const summary = response.content.split('.')[0] + '.';
    
    const successResponse: SuccessResponse = {
      data: {
        content: response.content,
        summary: summary.length > 150 ? summary.substring(0, 147) + '...' : summary,
        metadata: response.metadata,
        chatId,
      }
    };
    console.log('API route: Sending success response:', successResponse);
    return Response.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error in AI route:", error);

    const errorResponse: ErrorResponse = {
      error: {
        message: error instanceof Error ? error.message : "Failed to process request",
        code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
        details: error instanceof Error ? error.cause : undefined,
      },
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
