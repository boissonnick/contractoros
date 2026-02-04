# Sprint 41 - Demo Mode Feature

**Start Date:** 2026-02-04
**Focus:** Implement toggleable Demo Mode allowing any user to explore platform with pre-seeded demo data
**Estimated Effort:** 30-40 hours

---

## Overview

Replace hardcoded demo data constants with a toggleable "Demo Mode" that allows any authenticated user to switch to a shared demo organization ("Horizon Construction Co.") for platform exploration, sales demos, and user onboarding.

### User Requirements
- **Isolated demo environment** - Switch to demo org, user's real data hidden
- **Any authenticated user** can toggle demo mode
- **Pre-seeded shared demo org** - Horizon Construction Co. (existing seed data)
- **Full sandbox interaction** - Users can create/edit/delete, data resets periodically

---

## Sprint 41 Tasks

### Phase 1: Core Infrastructure (CLI 1)
**Priority:** HIGH | **Effort:** 8-12h

**1.1 Create Demo Mode Constants**
`apps/web/lib/demo/constants.ts`
```typescript
export const DEMO_ORG_ID = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';
export const DEMO_ORG_NAME = 'Horizon Construction Co.';
export const DEMO_MODE_STORAGE_KEY = 'contractoros_demo_mode';
export const DEMO_MODE_EXPIRY_HOURS = 4;

export const DEMO_USERS = {
  owner: { uid: 'demo-mike-johnson', displayName: 'Mike Johnson', role: 'OWNER' },
  pm: { uid: 'demo-sarah-williams', displayName: 'Sarah Williams', role: 'PM' },
  foreman: { uid: 'demo-carlos-rodriguez', displayName: 'Carlos Rodriguez', role: 'EMPLOYEE' },
  fieldWorker: { uid: 'demo-jake-thompson', displayName: 'Jake Thompson', role: 'EMPLOYEE' },
  admin: { uid: 'demo-emily-parker', displayName: 'Emily Parker', role: 'EMPLOYEE' },
};
```

**1.2 Create Demo Mode Context**
`apps/web/lib/contexts/DemoModeContext.tsx`
- Follow `ImpersonationContext.tsx` pattern
- localStorage persistence with 4-hour auto-expiry
- State: `{ isDemoMode, actualOrgId, demoUserId, startedAt }`
- Actions: `enterDemoMode()`, `exitDemoMode()`, `selectDemoRole()`
- Computed: `effectiveOrgId` returns demo org when active, real org when not

**1.3 Create Helper Hook**
`apps/web/lib/hooks/useEffectiveOrg.ts`
```typescript
export function useEffectiveOrg() {
  const { profile } = useAuth();
  const { isDemoMode, effectiveOrgId, demoUserRole } = useDemoMode();

  return {
    orgId: effectiveOrgId || profile?.orgId || null,
    isDemoMode,
    orgName: isDemoMode ? DEMO_ORG_NAME : profile?.orgName,
    displayName: isDemoMode ? demoUserRole?.displayName : profile?.displayName,
  };
}
```

**Tasks:**
- [ ] Create `apps/web/lib/demo/constants.ts`
- [ ] Create `apps/web/lib/contexts/DemoModeContext.tsx`
- [ ] Create `apps/web/lib/hooks/useEffectiveOrg.ts`
- [ ] Update `apps/web/components/Providers.tsx` to add DemoModeProvider

---

### Phase 2: UI Components (CLI 2)
**Priority:** HIGH | **Effort:** 8-10h

**2.1 Demo Mode Banner**
`apps/web/components/demo/DemoModeBanner.tsx`
- Purple/indigo banner (distinct from amber impersonation banner)
- Shows "Demo Mode - Horizon Construction Co."
- Displays current demo role
- "Exit Demo" button

**2.2 Demo Mode Selector**
`apps/web/components/demo/DemoModeSelector.tsx`
- Sidebar component for entering/exiting demo mode
- Role selector dropdown (Owner, PM, Foreman, etc.)
- Available to ALL authenticated users

**2.3 Demo Mode Toggle**
`apps/web/components/demo/DemoModeToggle.tsx`
- Simple on/off switch for quick access

**Tasks:**
- [ ] Create `apps/web/components/demo/DemoModeBanner.tsx`
- [ ] Create `apps/web/components/demo/DemoModeSelector.tsx`
- [ ] Create `apps/web/components/demo/DemoModeToggle.tsx`
- [ ] Create `apps/web/components/demo/index.ts` (barrel export)
- [ ] Update `apps/web/app/dashboard/layout.tsx` - add banner + sidebar toggle

---

### Phase 3: Integration & Rules (CLI 3)
**Priority:** HIGH | **Effort:** 6-8h

**3.1 Update Firestore Rules**
`firestore.rules`
```javascript
// Add demo org access helper
function isDemoOrg(orgId) {
  return orgId == 'u8hwVPLEv4YL9D71ymBwCOrmKta2';
}

function canAccessOrg(orgId) {
  return isSameOrg(orgId) || isDemoOrg(orgId);
}

// Update collection rules to use canAccessOrg() for reads
```

**3.2 Update Dashboard Page**
Replace `profile?.orgId` with `useEffectiveOrg().orgId`

**Tasks:**
- [ ] Update `firestore.rules` with demo org access rules
- [ ] Deploy rules: `firebase deploy --only firestore --project contractoros-483812`
- [ ] Update `apps/web/app/dashboard/page.tsx` to use `useEffectiveOrg`
- [ ] Update `apps/web/app/dashboard/projects/page.tsx`
- [ ] Update `apps/web/app/dashboard/clients/page.tsx`

---

### Phase 4: Testing & Polish (CLI 4)
**Priority:** MEDIUM | **Effort:** 4-6h

**Tasks:**
- [ ] Test entering demo mode - verify banner appears
- [ ] Test data switch - verify demo org data loads
- [ ] Test role switching - verify UI reflects role permissions
- [ ] Test persistence - refresh page, verify demo mode persists
- [ ] Test exit demo - verify return to real org data
- [ ] Test expiry - after 4 hours, verify auto-exit
- [ ] Test create data - create a project in demo mode
- [ ] Test isolation - exit demo, verify demo-created data not visible
- [ ] Run `npx tsc --noEmit` - ensure TypeScript passes

---

## Files Summary

### New Files (8)
| File | Purpose |
|------|---------|
| `apps/web/lib/demo/constants.ts` | Demo org/user constants |
| `apps/web/lib/contexts/DemoModeContext.tsx` | State management |
| `apps/web/lib/hooks/useEffectiveOrg.ts` | Helper hook |
| `apps/web/components/demo/DemoModeBanner.tsx` | Top banner |
| `apps/web/components/demo/DemoModeSelector.tsx` | Sidebar selector |
| `apps/web/components/demo/DemoModeToggle.tsx` | Simple toggle |
| `apps/web/components/demo/index.ts` | Barrel export |

### Modified Files (6+)
| File | Changes |
|------|---------|
| `apps/web/components/Providers.tsx` | Add DemoModeProvider |
| `apps/web/app/dashboard/layout.tsx` | Add banner + sidebar toggle |
| `firestore.rules` | Add demo org access rules |
| `apps/web/app/dashboard/page.tsx` | Use useEffectiveOrg |
| `apps/web/app/dashboard/projects/page.tsx` | Use useEffectiveOrg |
| `apps/web/app/dashboard/clients/page.tsx` | Use useEffectiveOrg |

---

## Data Flow

```
User clicks "Enter Demo Mode"
         │
         ▼
DemoModeContext stores state in localStorage
         │
         ▼
useEffectiveOrg() returns DEMO_ORG_ID
         │
         ▼
All hooks query demo org data
         │
         ▼
User sees Horizon Construction Co. data
         │
         ▼
User clicks "Exit Demo Mode"
         │
         ▼
Returns to real org context
```

---

## Security Considerations

1. **Authentication required** - Only logged-in users can enter demo mode
2. **Data isolation** - Demo mode only accesses demo org, never exposes real user data
3. **Write marking** - All demo-created data tagged with `isDemoData: true`
4. **Periodic reset** - Demo data cleaned up daily to prevent accumulation
5. **Impersonation interaction** - Demo mode takes precedence for orgId

---

## Success Criteria

- [ ] Demo mode toggle visible in sidebar for all authenticated users
- [ ] Purple banner displays when in demo mode
- [ ] Data correctly switches to Horizon Construction Co.
- [ ] Role selector changes displayed user role
- [ ] Demo mode persists across page refresh
- [ ] Demo mode auto-expires after 4 hours
- [ ] Exit demo returns user to real org data
- [ ] TypeScript passes
- [ ] Firestore rules allow demo org access

---

## File Ownership

| CLI | Files |
|-----|-------|
| CLI 1 | `lib/demo/`, `lib/contexts/DemoModeContext.tsx`, `lib/hooks/useEffectiveOrg.ts`, `Providers.tsx` |
| CLI 2 | `components/demo/`, `app/dashboard/layout.tsx` |
| CLI 3 | `firestore.rules`, dashboard pages |
| CLI 4 | Testing and verification |

---

## Dependencies

- **Existing Demo Data:** Horizon Construction Co. pre-seeded via `scripts/seed-demo/`
- **Impersonation Pattern:** Follow `ImpersonationContext.tsx` architecture
- **Firebase Auth:** Requires authenticated user to enable demo mode

---

## Future Enhancements (Post-Sprint)

1. **Demo Data Reset Cloud Function** - Scheduled cleanup of user-created demo data
2. **Admin Reset Button** - Manual trigger for demo data reset
3. **Demo Analytics** - Track demo mode usage for product insights
4. **Guided Tour Integration** - Combine with onboarding walkthrough
