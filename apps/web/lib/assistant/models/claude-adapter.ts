/**
 * Claude Model Adapter
 * Anthropic Claude integration for Pro tier
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/utils/logger';
import {
  ModelAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ChatMessage,
  AVAILABLE_MODELS,
} from './types';

export class ClaudeAdapter implements ModelAdapter {
  provider = 'claude' as const;
  modelId: string;

  private client: Anthropic;
  private modelConfig = AVAILABLE_MODELS['claude-sonnet'];

  constructor(apiKey: string, modelId: string = 'claude-sonnet-4-20250514') {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
    this.modelId = modelId;

    // Update model config if using a different model
    const configKey = Object.keys(AVAILABLE_MODELS).find(
      (key) =>
        AVAILABLE_MODELS[key].provider === 'claude' &&
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
      const messages = this.convertMessages(request.messages);

      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: request.maxTokens || this.modelConfig.maxTokens,
        system: request.systemPrompt,
        messages,
      });

      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('');

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      return {
        content,
        inputTokens,
        outputTokens,
        modelId: this.modelId,
        finishReason: this.mapStopReason(response.stop_reason),
        estimatedCost: this.estimateCost(inputTokens, outputTokens),
      };
    } catch (error) {
      logger.error('Chat error', { error, module: 'claude-adapter' });
      throw this.handleError(error);
    }
  }

  /**
   * Send a chat request and stream the response
   */
  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const messages = this.convertMessages(request.messages);

      const stream = this.client.messages.stream({
        model: this.modelId,
        max_tokens: request.maxTokens || this.modelConfig.maxTokens,
        system: request.systemPrompt,
        messages,
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            yield {
              type: 'delta',
              text: delta.text,
            };
          }
        } else if (event.type === 'message_delta') {
          // Final message with usage stats
          if (event.usage) {
            outputTokens = event.usage.output_tokens;
          }
        } else if (event.type === 'message_start') {
          if (event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }
      }

      yield {
        type: 'usage',
        inputTokens,
        outputTokens,
      };

      yield { type: 'done' };
    } catch (error) {
      logger.error('Stream error', { error, module: 'claude-adapter' });
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
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      return response.content.length > 0;
    } catch (error) {
      logger.error('API key validation failed', { error, module: 'claude-adapter' });
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
   * Convert our message format to Anthropic's format
   */
  private convertMessages(
    messages: ChatMessage[]
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .filter((m) => m.role !== 'system') // System messages go separately
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  /**
   * Map Anthropic stop reasons to our format
   */
  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'error' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      default:
        return 'stop';
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return new Error('Invalid or missing Anthropic API key');
      }
      if (error.status === 429) {
        return new Error('Anthropic API rate limit exceeded. Please try again later.');
      }
      if (error.status === 400) {
        return new Error('Invalid request to Anthropic API');
      }
      return new Error(`Anthropic API error: ${error.message}`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('An unknown error occurred with Claude');
  }
}
