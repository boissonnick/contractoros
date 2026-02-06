/**
 * AI Assistant Streaming API Route
 *
 * Handles streaming chat requests to the Claude API using Server-Sent Events.
 *
 * SECURITY: User's orgId is verified against Firebase Auth token, not client-provided data.
 * This prevents cross-organization data leakage.
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/assistant/prompts';
import { AssistantContext } from '@/lib/assistant/types';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase/firestore';
import { checkRateLimit, recordUsage, getRateLimitHeaders } from '@/lib/assistant/security/rate-limiter';
import { validatePrompt, logSecurityEvent, getBlockedPromptMessage } from '@/lib/assistant/security/prompt-guard';
import { logRateLimitExceeded } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';

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
  /** Firebase Auth ID token for verification */
  idToken?: string;
}

/**
 * Verify Firebase Auth token and extract user claims
 * Returns verified orgId and userId from token, not from client request
 */
async function verifyAuthToken(idToken: string): Promise<{
  uid: string;
  orgId: string | null;
  email: string | null;
}> {
  try {
    await initializeAdminApp();
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      orgId: decodedToken.orgId || null,
      email: decodedToken.email || null,
    };
  } catch (error) {
    logger.error('[Assistant Stream API] Auth verification failed', { error, route: 'assistant-stream' });
    throw new Error('Invalid authentication token');
  }
}

/**
 * Get orgId from user document if not in token claims
 */
async function getOrgIdFromUser(userId: string): Promise<string | null> {
  try {
    await initializeAdminApp();
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();

    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data()?.orgId || null;
    }
    return null;
  } catch (error) {
    logger.error('[Assistant Stream API] Failed to get orgId from user', { error, route: 'assistant-stream' });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, context, conversationHistory, options, idToken } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // =====================================
    // STEP 0: Verify Authentication
    // =====================================
    // SECURITY: We verify the auth token server-side and extract orgId from it
    // This prevents users from spoofing orgId to access other organizations' data

    // Try to get token from Authorization header first, then from body
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    const token = bearerToken || idToken;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please provide a valid auth token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let verifiedOrgId: string | null = null;
    let verifiedUserId: string | null = null;

    try {
      const authResult = await verifyAuthToken(token);
      verifiedUserId = authResult.uid;
      verifiedOrgId = authResult.orgId;

      // If orgId not in claims, get from user document
      if (!verifiedOrgId && verifiedUserId) {
        verifiedOrgId = await getOrgIdFromUser(verifiedUserId);
      }
    } catch (authError) {
      logger.error('[Assistant Stream API] Auth verification failed', { error: authError, route: 'assistant-stream' });
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!verifiedOrgId) {
      return new Response(
        JSON.stringify({ error: 'User not associated with an organization.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =====================================
    // STEP 1: Security Validation
    // =====================================
    const promptValidation = validatePrompt(message, {
      orgId: verifiedOrgId,
      userId: verifiedUserId || undefined,
    });

    if (!promptValidation.isValid) {
      // Log the security event
      logSecurityEvent(promptValidation, {
        orgId: verifiedOrgId,
        userId: verifiedUserId || 'unknown',
        promptPreview: message.slice(0, 100),
      });

      return new Response(
        JSON.stringify({
          error: getBlockedPromptMessage(promptValidation.threats),
          blocked: true,
          threats: promptValidation.threats,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =====================================
    // STEP 2: Rate Limiting
    // =====================================
    try {
      const db = getFirestore();
      const rateCheck = await checkRateLimit(db, verifiedOrgId, 'free');

      if (!rateCheck.allowed) {
        const headers = getRateLimitHeaders(rateCheck);

        // Log rate limit exceeded
        await logRateLimitExceeded(verifiedOrgId, verifiedUserId || undefined, {
          limit: rateCheck.remaining.requests + 1,
          current: rateCheck.remaining.requests + 1,
          resetAt: rateCheck.resetAt,
          endpoint: '/api/assistant/stream',
        });

        return new Response(
          JSON.stringify({
            error: rateCheck.reason || 'Rate limit exceeded',
            resetAt: rateCheck.resetAt,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }
    } catch (rateLimitError) {
      logger.warn('[Assistant Stream] Rate limit check failed', { error: rateLimitError, route: 'assistant-stream' });
      // Continue if rate limiting fails
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build verified context with server-verified orgId (not client-provided)
    const verifiedContext: AssistantContext = {
      ...context,
      organization: {
        ...context?.organization,
        orgId: verifiedOrgId, // Use verified orgId, not client-provided
      },
      user: {
        ...context?.user,
        userId: verifiedUserId || context?.user?.userId || 'unknown',
      },
    };

    // Build system prompt with verified context
    const systemPrompt = buildSystemPrompt(verifiedContext);

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

          // Record usage for rate limiting
          try {
            const db = getFirestore();
            await recordUsage(db, verifiedOrgId, {
              inputTokens: finalMessage.usage.input_tokens,
              outputTokens: finalMessage.usage.output_tokens,
              estimatedCost: (finalMessage.usage.input_tokens * 0.003 + finalMessage.usage.output_tokens * 0.015) / 1000,
              modelKey: 'claude-sonnet',
            });
          } catch (usageError) {
            logger.warn('[Assistant Stream] Usage recording failed', { error: usageError, route: 'assistant-stream' });
          }

          controller.close();
        } catch (error) {
          logger.error('Stream error', { error, route: 'assistant-stream' });
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
    logger.error('Assistant stream error', { error, route: 'assistant-stream' });

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
