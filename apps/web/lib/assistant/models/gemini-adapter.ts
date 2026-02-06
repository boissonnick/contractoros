/**
 * Gemini Model Adapter
 * Default model for ContractorOS AI Assistant (free tier)
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import {
  ModelAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ChatMessage,
  AVAILABLE_MODELS,
} from './types';

/**
 * Safety settings for Gemini
 * Using balanced settings appropriate for business context
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export class GeminiAdapter implements ModelAdapter {
  provider = 'gemini' as const;
  modelId: string;

  private client: GoogleGenerativeAI;
  private modelConfig = AVAILABLE_MODELS['gemini-2.0-flash'];

  constructor(apiKey: string, modelId: string = 'gemini-2.0-flash') {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelId = modelId;

    // Update model config if using a different model
    const configKey = Object.keys(AVAILABLE_MODELS).find(
      (key) => AVAILABLE_MODELS[key].modelId === modelId
    );
    if (configKey) {
      this.modelConfig = AVAILABLE_MODELS[configKey];
    }
  }

  /**
   * Send a chat request and get a complete response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelId,
        systemInstruction: request.systemPrompt,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          maxOutputTokens: request.maxTokens || this.modelConfig.maxTokens,
          temperature: request.temperature ?? 0.7,
        },
      });

      // Convert messages to Gemini format
      const history = this.convertToHistory(request.messages.slice(0, -1));
      const chat = model.startChat({ history });

      // Get the last user message
      const lastMessage = request.messages[request.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

      return {
        content: response.text(),
        inputTokens,
        outputTokens,
        modelId: this.modelId,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        estimatedCost: this.estimateCost(inputTokens, outputTokens),
      };
    } catch (error) {
      logger.error('Chat error', { error, module: 'gemini-adapter' });
      throw this.handleError(error);
    }
  }

  /**
   * Send a chat request and stream the response
   */
  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelId,
        systemInstruction: request.systemPrompt,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          maxOutputTokens: request.maxTokens || this.modelConfig.maxTokens,
          temperature: request.temperature ?? 0.7,
        },
      });

      // Convert messages to Gemini format
      const history = this.convertToHistory(request.messages.slice(0, -1));
      const chat = model.startChat({ history });

      // Get the last user message
      const lastMessage = request.messages[request.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      const result = await chat.sendMessageStream(lastMessage.content);

      // Stream the text chunks
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            type: 'delta',
            text,
          };
        }
      }

      // Get final response for usage stats
      const response = await result.response;
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

      yield {
        type: 'usage',
        inputTokens,
        outputTokens,
      };

      yield { type: 'done' };
    } catch (error) {
      logger.error('Stream error', { error, module: 'gemini-adapter' });
      yield {
        type: 'error',
        error: this.handleError(error).message,
      };
    }
  }

  /**
   * Validate that the API key is working
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelId });
      // Make a minimal request to verify the key works
      const result = await model.generateContent('Say "ok"');
      return !!result.response.text();
    } catch (error) {
      logger.error('API key validation failed', { error, module: 'gemini-adapter' });
      return false;
    }
  }

  /**
   * Estimate cost for tokens (Gemini 2.0 Flash is free)
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.modelConfig.costPer1kInputTokens;
    const outputCost = (outputTokens / 1000) * this.modelConfig.costPer1kOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Convert our message format to Gemini's history format
   */
  private convertToHistory(messages: ChatMessage[]): Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> {
    return messages
      .filter((m) => m.role !== 'system') // System messages go in systemInstruction
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }],
      }));
  }

  /**
   * Map Gemini finish reasons to our format
   */
  private mapFinishReason(
    reason?: string
  ): 'stop' | 'length' | 'error' | 'content_filter' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('API key')) {
        return new Error('Invalid or missing Gemini API key');
      }
      if (error.message.includes('quota')) {
        return new Error('Gemini API quota exceeded. Please try again later.');
      }
      if (error.message.includes('blocked')) {
        return new Error('Response was blocked by safety filters.');
      }
      return error;
    }
    return new Error('An unknown error occurred with Gemini');
  }
}
