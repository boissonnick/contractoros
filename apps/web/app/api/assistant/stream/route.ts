/**
 * AI Assistant Streaming API Route
 *
 * Handles streaming chat requests to the Claude API using Server-Sent Events.
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/assistant/prompts';
import { AssistantContext } from '@/lib/assistant/types';

// Initialize Anthropic client
const anthropic = new Anthropic();

interface RequestBody {
  message: string;
  context: AssistantContext;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, context, conversationHistory, options } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    messages.push({ role: 'user', content: message });

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 1024,
      system: systemPrompt,
      messages: messages,
    });

    // Create a ReadableStream to send SSE events
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream text deltas
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                const sseData = `data: ${JSON.stringify({ type: 'delta', text: delta.text })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
            } else if (event.type === 'message_stop') {
              // Send completion event
              const sseData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }

          // Get final message for usage stats
          const finalMessage = await stream.finalMessage();
          const usageData = `data: ${JSON.stringify({
            type: 'usage',
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
          })}\n\n`;
          controller.enqueue(encoder.encode(usageData));

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = `data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Assistant stream error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
