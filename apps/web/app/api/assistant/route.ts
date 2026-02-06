/**
 * AI Assistant API Route
 *
 * Handles chat requests to the AI model (Gemini by default) for the ContractorOS AI Assistant.
 * Includes security hardening, rate limiting, multi-model support, and rich org context.
 *
 * SECURITY: User's orgId is verified against Firebase Auth token, not client-provided data.
 * This prevents cross-organization data leakage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, buildSystemPromptWithServerContext } from '@/lib/assistant/prompts';
import { AssistantContext, DataSource, QuickAction } from '@/lib/assistant/types';
import { isPricingQuery, isSchedulingQuery, isProjectQuery } from '@/lib/assistant/claude-client';
import { ModelRouter, getDefaultModelKey } from '@/lib/assistant/models';
import {
  validatePrompt,
  logSecurityEvent,
  getBlockedPromptMessage,
} from '@/lib/assistant/security/prompt-guard';
import { processOutput } from '@/lib/assistant/security/output-guard';
import { getFirestore } from 'firebase/firestore';
import { checkRateLimit, recordUsage, getRateLimitHeaders } from '@/lib/assistant/security/rate-limiter';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { loadServerContext, type ServerContext } from '@/lib/assistant/server-context-loader';
import { getAuth } from 'firebase-admin/auth';
import { logRateLimitExceeded } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';

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
    stream?: boolean;
    modelKey?: string;
  };
  orgId?: string;
  userId?: string;
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
    logger.error('[Assistant API] Auth verification failed', { error, route: 'api-assistant' });
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
    logger.error('[Assistant API] Failed to get orgId from user', { error, route: 'api-assistant' });
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: RequestBody = await request.json();
    const { message, context, conversationHistory, options, idToken } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // =====================================
    // STEP 0: Verify Authentication
    // =====================================
    // SECURITY: We verify the auth token server-side and extract orgId from it
    // This prevents users from spoofing orgId to access other organizations' data
    let verifiedOrgId: string | null = null;
    let verifiedUserId: string | null = null;

    if (idToken) {
      try {
        const authResult = await verifyAuthToken(idToken);
        verifiedUserId = authResult.uid;
        verifiedOrgId = authResult.orgId;

        // If orgId not in claims, get from user document
        if (!verifiedOrgId && verifiedUserId) {
          verifiedOrgId = await getOrgIdFromUser(verifiedUserId);
        }
      } catch {
        logger.warn('[Assistant API] Auth verification failed, proceeding without server context', { route: 'api-assistant' });
      }
    }

    // Use verified values, fallback to client-provided only if auth failed
    const effectiveOrgId = verifiedOrgId || body.orgId || context?.organization?.orgId || 'unknown';
    const effectiveUserId = verifiedUserId || body.userId || context?.user?.userId || 'unknown';

    // =====================================
    // STEP 1: Security Validation
    // =====================================
    const promptValidation = validatePrompt(message, { orgId: effectiveOrgId, userId: effectiveUserId });

    if (!promptValidation.isValid) {
      // Log the security event
      logSecurityEvent(promptValidation, {
        orgId: effectiveOrgId,
        userId: effectiveUserId,
        promptPreview: message.slice(0, 100),
      });

      return NextResponse.json({
        message: getBlockedPromptMessage(promptValidation.threats),
        blocked: true,
        threats: promptValidation.threats,
      });
    }

    // =====================================
    // STEP 2: Rate Limiting (if orgId provided)
    // =====================================
    if (effectiveOrgId !== 'unknown') {
      try {
        // Use client-side Firestore for now (rate limiting in API)
        // In production, this should use Firebase Admin SDK
        const db = getFirestore();
        const rateCheck = await checkRateLimit(db, effectiveOrgId, 'free'); // TODO: Get tier from settings

        if (!rateCheck.allowed) {
          const headers = getRateLimitHeaders(rateCheck);

          // Log rate limit exceeded event
          logRateLimitExceeded(effectiveOrgId, effectiveUserId, {
            limit: rateCheck.remaining.requests + 1,
            current: rateCheck.remaining.requests + 1,
            resetAt: rateCheck.resetAt,
            endpoint: '/api/assistant',
          }).catch((err) => logger.error('[Assistant API] Failed to log rate limit', { error: err, route: 'api-assistant' }));

          return NextResponse.json(
            {
              error: rateCheck.reason || 'Rate limit exceeded',
              resetAt: rateCheck.resetAt,
            },
            {
              status: 429,
              headers,
            }
          );
        }
      } catch (rateLimitError) {
        // If rate limiting fails, log but continue (don't block the user)
        logger.warn('[Assistant] Rate limit check failed', { error: rateLimitError, route: 'api-assistant' });
      }
    }

    // =====================================
    // STEP 3: Model Selection & Routing
    // =====================================
    const modelRouter = new ModelRouter();
    const modelKey = options?.modelKey || getDefaultModelKey();

    // Check if at least one model is available
    const availableModels = modelRouter.getAvailableModels();
    if (availableModels.length === 0) {
      // No API keys configured - return helpful fallback
      return NextResponse.json(
        generateFallbackResponse(message, context)
      );
    }

    // =====================================
    // STEP 3.5: Load Rich Server Context
    // =====================================
    // Only load server context if we have verified auth
    let serverContext: ServerContext | null = null;
    let systemPrompt: string;

    if (verifiedOrgId && verifiedUserId) {
      try {
        logger.info(`[Assistant API] Loading server context for org: ${verifiedOrgId}`, { route: 'api-assistant' });
        serverContext = await loadServerContext(verifiedOrgId, verifiedUserId);
        // Build rich system prompt with server data
        systemPrompt = buildSystemPromptWithServerContext(serverContext, context);
        logger.info('[Assistant API] Server context loaded successfully', { route: 'api-assistant' });
      } catch (contextError) {
        logger.error('[Assistant API] Failed to load server context', { error: contextError, route: 'api-assistant' });
        // Fall back to client-only context
        systemPrompt = buildSystemPrompt(context);
      }
    } else {
      // No verified auth - use client-provided context only
      logger.info('[Assistant API] No verified auth, using client context only', { route: 'api-assistant' });
      systemPrompt = buildSystemPrompt(context);
    }

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current message (use sanitized version)
    messages.push({ role: 'user', content: promptValidation.sanitizedPrompt });

    // =====================================
    // STEP 4: Call AI Model
    // =====================================
    const response = await modelRouter.chat({
      messages,
      systemPrompt,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      orgId: effectiveOrgId,
      userId: effectiveUserId,
      modelKey,
    });

    // =====================================
    // STEP 5: Output Sanitization
    // =====================================
    const outputResult = processOutput(response.content, systemPrompt);

    if (outputResult.warnings.length > 0) {
      logger.warn('[Assistant] Output warnings', { warnings: outputResult.warnings, route: 'api-assistant' });
    }

    // =====================================
    // STEP 6: Record Usage
    // =====================================
    if (effectiveOrgId !== 'unknown') {
      try {
        const db = getFirestore();
        await recordUsage(db, effectiveOrgId, {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          estimatedCost: response.estimatedCost,
          modelKey,
        });
      } catch (usageError) {
        logger.warn('[Assistant] Usage recording failed', { error: usageError, route: 'api-assistant' });
      }
    }

    // =====================================
    // STEP 7: Build Response
    // =====================================
    const sources = extractSources(message, outputResult.content, context);
    const suggestedActions = generateSuggestedActions(message, outputResult.content);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      message: outputResult.content,
      sources,
      suggestedActions,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        model: response.modelId,
        estimatedCost: response.estimatedCost,
      },
      meta: {
        processingTime,
        modelKey,
        wasModified: outputResult.wasModified,
      },
    });
  } catch (error) {
    logger.error('[Assistant API Error]', { error, route: 'api-assistant' });

    // Return a generic error message
    return NextResponse.json(
      {
        error: 'An error occurred processing your request. Please try again.',
        message: "I'm having trouble right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a fallback response when no API keys are configured
 */
function generateFallbackResponse(
  message: string,
  context: AssistantContext
): { message: string; sources?: DataSource[]; suggestedActions?: QuickAction[] } {
  const _lowerMessage = message.toLowerCase();

  // Pricing query fallback
  if (isPricingQuery(message)) {
    return {
      message: `I'd love to help you with pricing information! To provide accurate, AI-powered pricing suggestions, please configure an AI API key in Settings.

In the meantime, you can:
- Check the **Materials** page for current price indices
- View the **Intelligence** dashboard for market trends
- Browse your past estimates for reference pricing

Once configured, I can analyze market data and provide specific recommendations for your projects.`,
      suggestedActions: [
        { id: 'materials', label: 'View Materials', type: 'navigate', payload: { route: '/dashboard/materials' } },
        { id: 'estimates', label: 'Past Estimates', type: 'navigate', payload: { route: '/dashboard/estimates' } },
        { id: 'ai-settings', label: 'Configure AI', type: 'navigate', payload: { route: '/dashboard/settings/ai' } },
      ],
    };
  }

  // Schedule query fallback
  if (isSchedulingQuery(message)) {
    return {
      message: `I can help with scheduling questions! To access AI-powered scheduling assistance, please configure an AI API key.

For now, you can:
- View your **Schedule** page for upcoming events
- Check the **Team** page for crew availability
- Review **Time Tracking** for recent activity`,
      suggestedActions: [
        { id: 'schedule', label: 'View Schedule', type: 'navigate', payload: { route: '/dashboard/schedule' } },
        { id: 'ai-settings', label: 'Configure AI', type: 'navigate', payload: { route: '/dashboard/settings/ai' } },
      ],
    };
  }

  // Project query fallback
  if (isProjectQuery(message)) {
    const projectInfo = context.activeProject
      ? `\n\nI see you're working on **${context.activeProject.name}** (${context.activeProject.status}).`
      : '';

    return {
      message: `I can provide detailed project insights with AI analysis! Configure an AI API key to unlock this feature.${projectInfo}

You can currently:
- View your **Projects** dashboard
- Check project **Reports** for analytics
- Review **Daily Logs** for updates`,
      suggestedActions: [
        { id: 'projects', label: 'View Projects', type: 'navigate', payload: { route: '/dashboard/projects' } },
        { id: 'reports', label: 'View Reports', type: 'navigate', payload: { route: '/dashboard/reports' } },
        { id: 'ai-settings', label: 'Configure AI', type: 'navigate', payload: { route: '/dashboard/settings/ai' } },
      ],
    };
  }

  // Default fallback
  return {
    message: `Hi! I'm the ContractorOS AI Assistant. To unlock my full capabilities including:

- **Pricing intelligence** - Market-based cost suggestions
- **Estimate assistance** - Help creating accurate estimates
- **Project insights** - AI-powered recommendations

Please configure an AI API key in the **AI Settings** page.

The free tier uses **Gemini 2.0 Flash** which has no usage costs!`,
    suggestedActions: [
      { id: 'ai-settings', label: 'AI Settings', type: 'navigate', payload: { route: '/dashboard/settings/ai' } },
      { id: 'help', label: 'Learn More', type: 'custom' },
    ],
  };
}

/**
 * Extract data sources mentioned or used in the response
 */
function extractSources(
  query: string,
  response: string,
  context: AssistantContext
): DataSource[] {
  const sources: DataSource[] = [];
  const lowerResponse = response.toLowerCase();

  // Check for material price references
  if (
    lowerResponse.includes('material') ||
    lowerResponse.includes('lumber') ||
    lowerResponse.includes('steel') ||
    lowerResponse.includes('price')
  ) {
    sources.push({
      type: 'material_price',
      label: 'Material Price Index',
      confidence: 'medium',
    });
  }

  // Check for labor rate references
  if (
    lowerResponse.includes('labor') ||
    lowerResponse.includes('hourly') ||
    lowerResponse.includes('wage') ||
    lowerResponse.includes('rate')
  ) {
    sources.push({
      type: 'labor_rate',
      label: 'Labor Rate Data',
      confidence: 'medium',
    });
  }

  // Check for benchmark references
  if (
    lowerResponse.includes('similar projects') ||
    lowerResponse.includes('market') ||
    lowerResponse.includes('average') ||
    lowerResponse.includes('typical')
  ) {
    sources.push({
      type: 'market_benchmark',
      label: 'Market Benchmarks',
      confidence: 'medium',
    });
  }

  // If referencing user's project
  if (context.activeProject && lowerResponse.includes(context.activeProject.name.toLowerCase())) {
    sources.push({
      type: 'project_data',
      label: context.activeProject.name,
      confidence: 'high',
    });
  }

  return sources;
}

/**
 * Generate suggested follow-up actions based on the conversation
 */
function generateSuggestedActions(
  query: string,
  response: string
): QuickAction[] {
  const actions: QuickAction[] = [];
  const lowerQuery = query.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // If discussing pricing, suggest viewing materials
  if (isPricingQuery(query)) {
    actions.push({
      id: 'view_prices',
      label: 'View current prices',
      type: 'navigate',
      payload: { route: '/dashboard/materials' },
    });
  }

  // If discussing estimates, suggest creating one
  if (
    lowerQuery.includes('estimate') ||
    lowerResponse.includes('estimate') ||
    lowerResponse.includes('quote')
  ) {
    actions.push({
      id: 'create_estimate',
      label: 'Create estimate',
      type: 'create_estimate',
    });
  }

  // If discussing schedule, suggest viewing calendar
  if (isSchedulingQuery(query)) {
    actions.push({
      id: 'view_schedule',
      label: 'View schedule',
      type: 'navigate',
      payload: { route: '/dashboard/schedule' },
    });
  }

  // Limit to 3 actions max
  return actions.slice(0, 3);
}
