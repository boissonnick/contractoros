# AI Provider Management Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issues:** #88, #90, #91, #92, #93

---

## Executive Summary

This document evaluates AI provider management architecture for ContractorOS, enabling multi-provider support, user-supplied API keys, and secure credential management. We recommend a **unified gateway approach**:

1. **Gateway Layer:** LiteLLM or custom gateway for provider abstraction
2. **Key Storage:** GCP Secret Manager with per-org encryption
3. **Provider Support:** OpenAI, Anthropic, Google AI (initial)
4. **Security:** Client-side encryption option for BYOK (Bring Your Own Key)

This architecture allows customers to use ContractorOS AI features with our API keys (default) or their own keys (cost control/compliance), while maintaining security isolation and audit logging.

---

## Requirements

### Issue #88: Default AI Toggle

- Opt-in/out for AI features globally
- Control anonymized data contribution
- Clear data usage disclosure

### Issue #90: User OAuth Connection

- Connect user's own OpenAI account
- Connect Anthropic account
- Connect Google AI account

### Issue #91: API Key Management

- Secure key storage (AES-256)
- Key rotation support
- Usage tracking per key

### Issue #92: Multi-Provider Support

- Provider selection per feature
- Fallback chains
- Cost optimization routing

### Issue #93: Security Requirements

- Encryption at rest
- Audit logging
- Per-org isolation
- Key expiration

---

## Technical Approach

### Architecture Options

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **LiteLLM** | Open source, 100+ providers | Self-hosted overhead | Medium |
| **Cloudflare AI Gateway** | Managed, unified billing | Vendor lock-in | Low |
| **Custom Gateway** | Full control | Build from scratch | High |
| **Direct Integration** | Simple | No abstraction | Low (initial) |

### Recommendation: LiteLLM + GCP Secret Manager

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContractorOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    AI Service Layer                      │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │   Provider    │  │     Key       │  │   Usage     │  │   │
│  │  │   Router      │  │   Manager     │  │   Tracker   │  │   │
│  │  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘  │   │
│  └──────────┼──────────────────┼─────────────────┼──────────┘   │
│             │                  │                 │              │
│             ▼                  ▼                 ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    LiteLLM Gateway                       │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │    OpenAI     │  │   Anthropic   │  │  Google AI  │  │   │
│  │  └───────────────┘  └───────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                 │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  GCP Secret Manager                      │   │
│  │       Per-org encrypted API keys + audit logs            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Organization AI Settings

```typescript
interface OrgAISettings {
  orgId: string;

  // Issue #88: Default AI toggle
  aiEnabled: boolean;
  dataContribution: 'none' | 'anonymized' | 'full';

  // Issue #92: Provider preferences
  defaultProvider: AIProvider;
  providerPriority: AIProvider[];  // Fallback order

  // Feature-specific providers
  featureProviders: {
    insights: AIProvider;
    assistant: AIProvider;
    documentAnalysis: AIProvider;
  };

  // Rate limits
  monthlyBudget?: number;        // USD cap
  dailyRequestLimit?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AIProvider = 'openai' | 'anthropic' | 'google' | 'platform';
// 'platform' = use ContractorOS shared keys
```

### API Key Configuration

```typescript
interface AIProviderKey {
  id: string;
  orgId: string;
  provider: AIProvider;

  // Issue #91: Encrypted storage
  encryptedKey: string;          // AES-256-GCM encrypted
  keyVersion: number;            // For rotation tracking
  secretManagerRef?: string;     // GCP Secret Manager path

  // Metadata
  name: string;                  // User-friendly name
  createdBy: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
  expiresAt?: Timestamp;

  // Issue #93: Security
  status: 'active' | 'expired' | 'revoked';
  rotationSchedule?: 'monthly' | 'quarterly' | 'yearly';
  nextRotation?: Timestamp;
}
```

### Usage Tracking

```typescript
interface AIUsageRecord {
  id: string;
  orgId: string;
  keyId: string;                 // Which key was used
  provider: AIProvider;

  // Request details
  model: string;                 // 'gpt-4o', 'claude-sonnet-4'
  feature: string;               // 'insights', 'assistant'
  inputTokens: number;
  outputTokens: number;
  cost: number;                  // Estimated USD

  // Timing
  requestedAt: Timestamp;
  duration: number;              // ms
  success: boolean;
  errorType?: string;
}
```

---

## Provider Integration

### LiteLLM Configuration

```python
# litellm_config.yaml
model_list:
  # OpenAI models
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  # Anthropic models
  - model_name: claude-sonnet-4
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-haiku-4
    litellm_params:
      model: anthropic/claude-haiku-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  # Google models
  - model_name: gemini-2-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_AI_KEY

router_settings:
  routing_strategy: cost-based  # or latency-based
  fallback_models:
    claude-sonnet-4: [gpt-4o, gemini-2-flash]

general_settings:
  max_budget: 1000              # Monthly USD limit
  budget_duration: monthly
```

### Provider-Specific Routing

```typescript
// Route request to appropriate provider
async function routeAIRequest(
  orgId: string,
  feature: string,
  request: AIRequest
): Promise<AIResponse> {
  const settings = await getOrgAISettings(orgId);

  if (!settings.aiEnabled) {
    throw new Error('AI features disabled for organization');
  }

  // Get provider for feature
  const provider = settings.featureProviders[feature] || settings.defaultProvider;

  // Get API key (org's own or platform)
  const apiKey = await getAPIKey(orgId, provider);

  // Make request via LiteLLM
  const response = await litellm.completion({
    model: getModelForProvider(provider, feature),
    messages: request.messages,
    api_key: apiKey,
    metadata: {
      orgId,
      feature,
      userId: request.userId,
    },
  });

  // Track usage
  await trackUsage(orgId, provider, response.usage);

  return response;
}
```

---

## Security Implementation

### Key Encryption (Issue #91, #93)

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManager = new SecretManagerServiceClient();

// Store API key in Secret Manager
async function storeAPIKey(
  orgId: string,
  provider: AIProvider,
  apiKey: string
): Promise<string> {
  const secretId = `ai-key-${orgId}-${provider}`;
  const parent = `projects/${PROJECT_ID}`;

  // Create secret
  const [secret] = await secretManager.createSecret({
    parent,
    secretId,
    secret: {
      replication: {
        automatic: {},
      },
      labels: {
        org_id: orgId,
        provider: provider,
      },
    },
  });

  // Add version with actual key
  await secretManager.addSecretVersion({
    parent: secret.name,
    payload: {
      data: Buffer.from(apiKey, 'utf8'),
    },
  });

  return secretId;
}

// Retrieve API key
async function getAPIKey(
  orgId: string,
  provider: AIProvider
): Promise<string> {
  // Check if org has own key
  const orgKey = await getOrgProviderKey(orgId, provider);

  if (orgKey && orgKey.status === 'active') {
    const secretPath = `projects/${PROJECT_ID}/secrets/${orgKey.secretManagerRef}/versions/latest`;
    const [version] = await secretManager.accessSecretVersion({ name: secretPath });
    return version.payload.data.toString();
  }

  // Fall back to platform keys
  return getPlatformKey(provider);
}
```

### Client-Side Encryption Option

For organizations requiring that keys never touch our servers in plaintext:

```typescript
// Browser: Encrypt key before sending
async function encryptKeyClientSide(
  apiKey: string,
  orgPublicKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    orgPublicKey,
    data
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Server: Store encrypted blob (can't read it)
// Only Cloud Function with org's private key can decrypt
```

### Audit Logging (Issue #93)

```typescript
interface AIAuditLog {
  id: string;
  orgId: string;
  userId: string;
  action: 'key_created' | 'key_accessed' | 'key_rotated' | 'key_revoked' | 'request_made';

  // Details
  provider?: AIProvider;
  keyId?: string;
  ipAddress: string;
  userAgent: string;

  // For requests
  model?: string;
  feature?: string;
  tokenCount?: number;

  timestamp: Timestamp;
}

// Log every key access
async function logKeyAccess(
  orgId: string,
  keyId: string,
  context: RequestContext
) {
  await addDoc(collection(db, 'organizations', orgId, 'aiAuditLogs'), {
    orgId,
    userId: context.userId,
    action: 'key_accessed',
    keyId,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    timestamp: serverTimestamp(),
  });
}
```

---

## User Interface

### Settings Page

```
/dashboard/settings/ai-providers

┌─────────────────────────────────────────────────────────────────┐
│  AI Settings                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI Features                                           [ON/OFF] │
│  Enable AI-powered insights, assistant, and analysis            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Data Contribution                                              │
│  ○ None - No data shared                                        │
│  ○ Anonymized - Help improve AI (recommended)                   │
│  ○ Full - Include organization context                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  API Keys                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ OpenAI          [Use Platform Key]    [Add Your Key]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Anthropic       ✓ Your Key (sk-...xyz)  [Rotate] [Remove] │   │
│  │                 Last used: 2 hours ago                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Google AI       [Use Platform Key]    [Add Your Key]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Usage This Month                                               │
│  │████████████░░░░░░░░│ $45.32 / $100.00 budget               │
│                                                                 │
│  [View Detailed Usage]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Add Key Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Add OpenAI API Key                                       [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Key                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Key Name (optional)                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Production Key                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⓘ Your key is encrypted before storage. We cannot see it.     │
│                                                                 │
│  □ Enable automatic rotation reminder (every 90 days)           │
│                                                                 │
│                              [Cancel]  [Save Key]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fallback & Cost Optimization

### Fallback Chain

```typescript
const FALLBACK_CHAINS: Record<string, AIProvider[]> = {
  insights: ['anthropic', 'openai', 'google'],
  assistant: ['anthropic', 'openai', 'google'],
  documentAnalysis: ['google', 'anthropic', 'openai'],
};

async function executeWithFallback(
  orgId: string,
  feature: string,
  request: AIRequest
): Promise<AIResponse> {
  const chain = FALLBACK_CHAINS[feature];

  for (const provider of chain) {
    try {
      return await routeAIRequest(orgId, feature, { ...request, provider });
    } catch (error) {
      if (isRetryable(error)) {
        console.log(`Provider ${provider} failed, trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('All providers failed');
}
```

### Cost-Based Routing

```typescript
const MODEL_COSTS = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'claude-sonnet-4': { input: 3.00, output: 15.00 },
  'claude-haiku-4': { input: 1.00, output: 5.00 },
  'gemini-2-flash': { input: 0.10, output: 0.40 },
};

function selectCheapestModel(
  feature: string,
  estimatedTokens: number
): string {
  const suitableModels = FEATURE_MODELS[feature];

  return suitableModels.reduce((cheapest, model) => {
    const cost = estimateCost(model, estimatedTokens);
    const cheapestCost = estimateCost(cheapest, estimatedTokens);
    return cost < cheapestCost ? model : cheapest;
  });
}
```

---

## Implementation Plan

### Phase 1: Foundation (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| AI settings data model | 4h | None |
| Settings UI component | 8h | Model |
| Default toggle (Issue #88) | 4h | UI |
| Data contribution settings | 4h | Toggle |
| **Subtotal** | **20h** | |

### Phase 2: Key Management (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Secret Manager integration | 8h | Phase 1 |
| Key storage service | 12h | Secret Manager |
| Add key UI/flow | 8h | Service |
| Key rotation | 6h | UI |
| Key revocation | 4h | Rotation |
| **Subtotal** | **38h** | |

### Phase 3: Multi-Provider (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| LiteLLM deployment | 8h | Phase 2 |
| Provider router | 12h | LiteLLM |
| Fallback logic | 8h | Router |
| Cost-based routing | 8h | Router |
| Feature-specific routing | 6h | Routing |
| **Subtotal** | **42h** | |

### Phase 4: Security & Audit (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Audit logging | 8h | Phase 3 |
| Usage tracking | 8h | Logging |
| Budget enforcement | 6h | Tracking |
| Key expiration | 4h | Logging |
| **Subtotal** | **26h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 12h | None (complete) |
| Phase 1: Foundation | 20h | Research |
| Phase 2: Key Management | 38h | Phase 1 |
| Phase 3: Multi-Provider | 42h | Phase 2 |
| Phase 4: Security | 26h | Phase 3 |
| **Total** | **138h** | |

**Estimated Duration:** 10-12 weeks

---

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Key exposure in logs | Never log keys, use Secret Manager |
| Key theft from DB | Encrypted at rest, per-org isolation |
| Unauthorized access | IAM roles, audit logging |
| Side-channel via timing | Constant-time key comparison |
| Key reuse across orgs | Unique keys per organization |

### Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Encryption at rest** | GCP Secret Manager (AES-256) |
| **Encryption in transit** | TLS 1.3 for all API calls |
| **Access control** | IAM + org-level isolation |
| **Audit trail** | Firestore audit logs |
| **Key rotation** | Configurable schedule + manual |
| **Data residency** | Regional Secret Manager |

### Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Optional: Client-side encryption before key submission  │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ TLS 1.3
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Cloud Run / Functions                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Key Management Service                      │   │
│  │  - Validates key format                                  │   │
│  │  - Stores in Secret Manager                              │   │
│  │  - Logs access to Firestore                              │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  GCP Secret     │  │   Firestore     │  │   Cloud Audit   │
│  Manager        │  │   (Audit Logs)  │  │   Logs          │
│  (Encrypted)    │  │   (Org-scoped)  │  │   (System)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Open Questions

- [ ] Should we support OAuth flows (OpenAI, Google) vs. just API keys?
- [ ] What's our liability if a customer's key is compromised?
- [ ] Should we allow key sharing across organizations (enterprise)?
- [ ] Do we need hardware security modules (HSM) for key storage?
- [ ] How do we handle provider outages gracefully?
- [ ] Should AI provider settings be per-user or per-org only?

---

## References

- [LiteLLM Documentation](https://docs.litellm.ai/)
- [GCP Secret Manager](https://cloud.google.com/secret-manager)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Mozilla any-llm-gateway](https://github.com/Mozilla-Ocho/any-llm)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Anthropic Security Docs](https://docs.anthropic.com/en/docs/security)
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
