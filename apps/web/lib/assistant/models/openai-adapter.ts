/**
 * OpenAI Model Adapter
 * GPT-4o integration for Pro/Enterprise tier
 */

import OpenAI from 'openai';
import {
  ModelAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ChatMessage,
  AVAILABLE_MODELS,
} from './types';

export class OpenAIAdapter implements ModelAdapter {
  provider = 'openai' as const;
  modelId: string;

  private client: OpenAI;
  private modelConfig = AVAILABLE_MODELS['gpt-4o'];

  constructor(apiKey: string, modelId: string = 'gpt-4o') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
    this.modelId = modelId;

    // Update model config if using a different model
    const configKey = Object.keys(AVAILABLE_MODELS).find(
      (key) =>
        AVAILABLE_MODELS[key].provider === 'openai' &&
        AVAILABLE_MODELS[key].modelId === modelId
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
      const messages = this.convertMessages(request.messages, request.systemPrompt);

      const response = await this.client.chat.completions.create({
        model: this.modelId,
        max_tokens: request.maxTokens || this.modelConfig.maxTokens,
        temperature: request.temperature ?? 0.7,
        messages,
      });

      const choice = response.choices[0];
      const content = choice?.message?.content || '';

      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;

      return {
        content,
        inputTokens,
        outputTokens,
        modelId: this.modelId,
        finishReason: this.mapFinishReason(choice?.finish_reason),
        estimatedCost: this.estimateCost(inputTokens, outputTokens),
      };
    } catch (error) {
      console.error('[OpenAIAdapter] Chat error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send a chat request and stream the response
   */
  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const messages = this.convertMessages(request.messages, request.systemPrompt);

      const stream = await this.client.chat.completions.create({
        model: this.modelId,
        max_tokens: request.maxTokens || this.modelConfig.maxTokens,
        temperature: request.temperature ?? 0.7,
        messages,
        stream: true,
        stream_options: { include_usage: true },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        // Handle content deltas
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield {
            type: 'delta',
            text: delta.content,
          };
        }

        // Handle usage info (comes in final chunk)
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }
      }

      yield {
        type: 'usage',
        inputTokens,
        outputTokens,
      };

      yield { type: 'done' };
    } catch (error) {
      console.error('[OpenAIAdapter] Stream error:', error);
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
      const response = await this.client.chat.completions.create({
        model: this.modelId,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      return response.choices.length > 0;
    } catch (error) {
      console.error('[OpenAIAdapter] API key validation failed:', error);
      return false;
    }
  }

  /**
   * Estimate cost for tokens
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.modelConfig.costPer1kInputTokens;
    const outputCost = (outputTokens / 1000) * this.modelConfig.costPer1kOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Convert our message format to OpenAI's format
   */
  private convertMessages(
    messages: ChatMessage[],
    systemPrompt: string
  ): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt first
    if (systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation messages (filter out any duplicate system messages)
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Skip system messages as we already added the systemPrompt
        continue;
      }
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return openaiMessages;
  }

  /**
   * Map OpenAI finish reasons to our format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): 'stop' | 'length' | 'error' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return new Error('Invalid or missing OpenAI API key');
      }
      if (error.status === 429) {
        return new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      if (error.status === 400) {
        return new Error('Invalid request to OpenAI API');
      }
      if (error.status === 503) {
        return new Error('OpenAI service temporarily unavailable. Please try again later.');
      }
      return new Error(`OpenAI API error: ${error.message}`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('An unknown error occurred with OpenAI');
  }
}
