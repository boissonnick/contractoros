# Bundle Analysis

This document describes how to analyze and optimize the bundle size for ContractorOS.

## Running Analysis

To analyze the bundle:
```bash
cd apps/web
ANALYZE=true npm run build
```

This opens a browser window with an interactive treemap visualization showing:
- **Client-side bundles** - JavaScript sent to the browser
- **Server-side bundles** - Code running on the server (SSR)

## Expected Bundle Targets

| Metric | Target | Description |
|--------|--------|-------------|
| First JS | < 200KB | Initial JavaScript downloaded |
| Main bundle | < 250KB | Core app JavaScript |
| Total JS | < 500KB | All JavaScript for initial page |

## Large Dependencies to Monitor

| Package | Typical Size | Notes |
|---------|-------------|-------|
| @react-pdf/renderer | ~500KB | Used for PDF generation, lazy load |
| recharts | ~200KB | Used for charts, lazy load |
| date-fns | ~50KB | Tree-shakeable |
| firebase | ~100KB | Required |
| react-hook-form | ~30KB | Form handling |
| zod | ~15KB | Schema validation |

## Optimization Strategies

### 1. Dynamic Imports for Heavy Features

```typescript
// Instead of:
import { PDFDocument } from '@react-pdf/renderer';

// Use dynamic import:
const PDFDocument = dynamic(() => import('@react-pdf/renderer'), {
  loading: () => <p>Loading PDF...</p>,
  ssr: false
});
```

### 2. Tree Shaking for Utility Libraries

```typescript
// Instead of:
import _ from 'lodash';

// Import specific functions:
import debounce from 'lodash/debounce';
```

### 3. Code Splitting by Route

Next.js automatically code splits by route. Verify in the analyzer that:
- Each page has its own chunk
- Shared code is in common chunks
- No unexpected large dependencies in page bundles

### 4. Lazy Loading for Below-Fold Content

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

## Current Configuration

The `next.config.js` includes these optimizations:

| Setting | Value | Purpose |
|---------|-------|---------|
| `reactStrictMode` | `true` | Development warnings |
| `output` | `'standalone'` | Optimized Docker builds |

## Performance Checklist

After major changes, run the bundle analysis:

- [ ] Run `ANALYZE=true npm run build` after major changes
- [ ] Check that main bundle stays under 250KB
- [ ] Verify no unexpected large dependencies
- [ ] Look for duplicate packages (multiple versions)
- [ ] Check that lazy-loaded components are in separate chunks
- [ ] Test Lighthouse performance score

## Lighthouse Baseline

Record baseline scores for key pages:

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Dashboard | TBD | TBD | TBD | TBD |
| Projects List | TBD | TBD | TBD | TBD |
| Project Detail | TBD | TBD | TBD | TBD |
| Subcontractors | TBD | TBD | TBD | TBD |

To run Lighthouse:
```bash
# For local development
npx lighthouse http://localhost:3000/dashboard --view

# For production
npx lighthouse https://contractoros.com/dashboard --view
```

## Common Issues

### Large First Load JS

If first load JS exceeds targets:
1. Check for non-dynamic imports of heavy libraries
2. Look for barrel file imports (`import { x } from '@/components'`)
3. Consider lazy loading features not needed immediately

### Duplicate Dependencies

The analyzer shows duplicate packages in different colors. Common causes:
- Multiple versions of the same package
- Shared dependencies not hoisted properly

Fix with:
```bash
npm dedupe
```

### Unexpectedly Large Chunks

If a chunk is larger than expected:
1. Click on it in the analyzer to see contents
2. Identify the largest dependencies
3. Consider if they can be lazy loaded or replaced

## Monitoring Over Time

Track these metrics in CI/CD:
- Total bundle size
- Largest chunk size
- Number of chunks
- Lighthouse performance score

Consider adding bundle size checks to PR workflow.
