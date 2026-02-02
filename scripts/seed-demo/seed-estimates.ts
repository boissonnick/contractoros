#!/usr/bin/env ts-node
/**
 * Seed demo estimates for ContractorOS
 *
 * Creates 18 estimates:
 * - 12 Accepted (became projects)
 * - 3 Pending (sent to clients, awaiting response)
 * - 2 Declined (with decline reasons)
 * - 1 Draft (in progress)
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/seed-estimates.ts
 *   # or
 *   npm run seed:estimates
 */

import * as admin from 'firebase-admin';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  DEMO_USERS,
  daysAgo,
  daysFromNow,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  generateId,
} from './utils';
import {
  KITCHEN_REMODEL_ITEMS,
  BATHROOM_REMODEL_ITEMS,
  DECK_BUILD_ITEMS,
  COMMERCIAL_TI_ITEMS,
  FENCE_INSTALLATION_ITEMS,
  BASEMENT_FINISH_ITEMS,
  GARAGE_ADDITION_ITEMS,
  POOL_HOUSE_ITEMS,
  RETAIL_STOREFRONT_ITEMS,
  SCOPE_OF_WORK_TEMPLATES,
  LABOR_RATE,
  calculateLineItemTotal,
  LineItemTemplate,
} from './data/project-templates';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

const db = admin.firestore();

// ============================================
// Types
// ============================================

// Client info type that allows for additional demo clients
interface DemoClientInfo {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  isCommercial: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface DemoEstimate {
  id: string;
  number: string;
  name: string;
  client: DemoClientInfo;
  projectId?: string;
  projectAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
  lineItemTemplates: LineItemTemplate[];
  scopeOfWork: string;
  markupPercent: number;
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  validUntil: Date;
  notes?: string;
}

// ============================================
// Helper to create estimate line items
// ============================================

function createLineItems(templates: LineItemTemplate[], markupPercent: number) {
  return templates.map((template, index) => {
    const calculated = calculateLineItemTotal(template, LABOR_RATE, markupPercent);
    return {
      id: generateId('line'),
      sortOrder: index + 1,
      name: template.description,
      description: '',
      category: template.category,
      quantity: template.quantity,
      unit: template.unit,
      unitCost: Math.round((calculated.total / template.quantity) * 100) / 100,
      totalCost: calculated.total,
      laborHours: template.laborHours,
      laborRate: LABOR_RATE,
      laborCost: calculated.laborCost,
      materialCost: calculated.materialsCost,
      markup: markupPercent,
      markupType: 'percent' as const,
    };
  });
}

// ============================================
// ACCEPTED ESTIMATES (12) - Linked to Projects
// ============================================

const acceptedEstimates: DemoEstimate[] = [
  // 1. Smith Kitchen Remodel
  {
    id: 'demo-est-smith-kitchen',
    number: 'EST-2025-001',
    name: 'Smith Kitchen Remodel',
    client: { ...DEMO_CLIENTS.smith },
    projectId: 'demo-proj-smith-kitchen',
    projectAddress: { street: '1234 Maple Street', city: 'Denver', state: 'CO', zip: '80202' },
    status: 'accepted',
    lineItemTemplates: KITCHEN_REMODEL_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.kitchenRemodel,
    markupPercent: 15,
    createdAt: monthsAgo(10),
    sentAt: monthsAgo(10),
    viewedAt: daysAgo(300 - 2),
    acceptedAt: daysAgo(300 - 5),
    validUntil: monthsAgo(9),
    notes: 'Client signed within 5 days. Very motivated.',
  },

  // 2. Wilson Fence Installation
  {
    id: 'demo-est-wilson-fence',
    number: 'EST-2025-002',
    name: 'Wilson Fence Installation',
    client: { ...DEMO_CLIENTS.wilson },
    projectId: 'demo-proj-wilson-fence',
    projectAddress: { street: '234 Birch Lane', city: 'Centennial', state: 'CO', zip: '80112' },
    status: 'accepted',
    lineItemTemplates: FENCE_INSTALLATION_ITEMS,
    scopeOfWork: `SCOPE OF WORK - Privacy Fence Installation

1. SITE PREPARATION
   - Call 811 for utility locates
   - Mark fence line with client
   - Verify property lines

2. POST INSTALLATION
   - Dig post holes 18" diameter x 36" deep
   - Set 4x4 cedar posts in concrete
   - Allow 48 hours cure before loading

3. RAILS & PICKETS
   - Install horizontal 2x4 rails
   - Install 6' cedar pickets with 1/4" gap
   - Pre-stain backs of pickets

4. GATE
   - Build and install 4' wide gate
   - Self-closing hinges
   - Thumb latch

5. FINISH
   - Apply semi-transparent stain
   - Site cleanup

EXCLUSIONS:
- Survey (by others)
- Sprinkler head relocation
`,
    markupPercent: 12,
    createdAt: monthsAgo(7),
    sentAt: daysAgo(210 - 1),
    viewedAt: daysAgo(210 - 2),
    acceptedAt: daysAgo(210 - 3),
    validUntil: monthsAgo(6),
  },

  // 3. Main St. Retail Storefront
  {
    id: 'demo-est-mainst-retail',
    number: 'EST-2025-003',
    name: 'Main St. Retail Storefront',
    client: { ...DEMO_CLIENTS.mainStRetail },
    projectId: 'demo-proj-mainst-retail',
    projectAddress: { street: '250 Main Street', city: 'Denver', state: 'CO', zip: '80202' },
    status: 'accepted',
    lineItemTemplates: RETAIL_STOREFRONT_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.commercialTI,
    markupPercent: 18,
    createdAt: monthsAgo(8),
    sentAt: daysAgo(240 - 2),
    viewedAt: daysAgo(240 - 3),
    acceptedAt: daysAgo(240 - 10),
    validUntil: monthsAgo(7),
    notes: 'Negotiated from original $135k. Final at $125k.',
  },

  // 4. Garcia Master Bath
  {
    id: 'demo-est-garcia-bath',
    number: 'EST-2025-004',
    name: 'Garcia Master Bath',
    client: { ...DEMO_CLIENTS.garcia },
    projectId: 'demo-proj-garcia-bath',
    projectAddress: { street: '567 Oak Avenue', city: 'Lakewood', state: 'CO', zip: '80226' },
    status: 'accepted',
    lineItemTemplates: BATHROOM_REMODEL_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.bathroomRemodel,
    markupPercent: 15,
    createdAt: monthsAgo(4),
    sentAt: daysAgo(120 - 1),
    viewedAt: daysAgo(120 - 2),
    acceptedAt: daysAgo(120 - 7),
    validUntil: monthsAgo(3),
  },

  // 5. Downtown Cafe TI
  {
    id: 'demo-est-cafe-ti',
    number: 'EST-2025-005',
    name: 'Downtown Cafe TI',
    client: { ...DEMO_CLIENTS.downtownCafe },
    projectId: 'demo-proj-cafe-ti',
    projectAddress: { street: '100 Main Street', city: 'Denver', state: 'CO', zip: '80202' },
    status: 'accepted',
    lineItemTemplates: COMMERCIAL_TI_ITEMS.slice(0, 20), // Subset for cafe
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.commercialTI,
    markupPercent: 16,
    createdAt: monthsAgo(3),
    sentAt: daysAgo(90 - 2),
    viewedAt: daysAgo(90 - 3),
    acceptedAt: daysAgo(90 - 8),
    validUntil: monthsAgo(2),
    notes: 'Landlord required additional insurance documentation.',
  },

  // 6. Thompson Deck Build
  {
    id: 'demo-est-thompson-deck',
    number: 'EST-2025-006',
    name: 'Thompson Deck Build',
    client: { ...DEMO_CLIENTS.thompson },
    projectId: 'demo-proj-thompson-deck',
    projectAddress: { street: '890 Pine Road', city: 'Aurora', state: 'CO', zip: '80012' },
    status: 'accepted',
    lineItemTemplates: DECK_BUILD_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.deckBuild,
    markupPercent: 15,
    createdAt: daysAgo(28),
    sentAt: daysAgo(27),
    viewedAt: daysAgo(26),
    acceptedAt: daysAgo(21),
    validUntil: daysFromNow(2),
  },

  // 7. Office Park Suite 200
  {
    id: 'demo-est-office-park',
    number: 'EST-2025-007',
    name: 'Office Park Suite 200',
    client: { ...DEMO_CLIENTS.officePark },
    projectId: 'demo-proj-office-park',
    projectAddress: { street: '500 Business Parkway', city: 'Englewood', state: 'CO', zip: '80111' },
    status: 'accepted',
    lineItemTemplates: COMMERCIAL_TI_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.commercialTI,
    markupPercent: 17,
    createdAt: daysAgo(45),
    sentAt: daysAgo(44),
    viewedAt: daysAgo(42),
    acceptedAt: daysAgo(35),
    validUntil: daysAgo(15),
  },

  // 8. Garcia Basement Finish
  {
    id: 'demo-est-garcia-basement',
    number: 'EST-2025-008',
    name: 'Garcia Basement Finish',
    client: { ...DEMO_CLIENTS.garcia },
    projectId: 'demo-proj-garcia-basement',
    projectAddress: { street: '567 Oak Avenue', city: 'Lakewood', state: 'CO', zip: '80226' },
    status: 'accepted',
    lineItemTemplates: BASEMENT_FINISH_ITEMS,
    scopeOfWork: `SCOPE OF WORK - Basement Finish

1. FRAMING
   - Frame all walls per plan with moisture barrier at exterior
   - Frame bulkheads around mechanicals
   - Frame bedroom, bathroom, and rec room

2. EGRESS WINDOW
   - Cut opening and install egress window well
   - Install code-compliant egress window
   - Waterproof around installation

3. ELECTRICAL
   - Complete rough-in per plan
   - Install 12 recessed lights
   - 16 outlets and switches
   - Smoke/CO detectors per code

4. PLUMBING
   - Rough for bathroom (toilet, vanity, shower)
   - Connect to existing drains

5. HVAC
   - Extend existing system to basement
   - 4 supply registers, 2 returns

6. INSULATION & DRYWALL
   - R-19 wall insulation with vapor barrier
   - Hang and finish drywall (Level 4)

7. FLOORING
   - Install LVP throughout main areas
   - Tile in bathroom

8. FINISH
   - Install doors and trim
   - Paint walls and ceiling
   - Install bathroom fixtures

EXCLUSIONS:
- Carpet (if desired, by others)
- Furniture or entertainment systems
`,
    markupPercent: 15,
    createdAt: daysAgo(35),
    sentAt: daysAgo(34),
    viewedAt: daysAgo(32),
    acceptedAt: daysAgo(28),
    validUntil: daysAgo(4),
    notes: 'Return customer - gave 5% loyalty discount.',
  },

  // 9. Brown Kitchen Update
  {
    id: 'demo-est-brown-kitchen',
    number: 'EST-2025-009',
    name: 'Brown Kitchen Update',
    client: { ...DEMO_CLIENTS.brown },
    projectId: 'demo-proj-brown-kitchen',
    projectAddress: { street: '678 Cedar Court', city: 'Littleton', state: 'CO', zip: '80120' },
    status: 'accepted',
    lineItemTemplates: KITCHEN_REMODEL_ITEMS.slice(9, 22), // Subset for cabinet refacing
    scopeOfWork: `SCOPE OF WORK - Kitchen Cabinet Refacing & Update

1. PREPARATION
   - Protect floors and adjacent areas
   - Remove doors, drawers, and hardware
   - Remove existing countertops and backsplash

2. CABINET REFACING
   - Apply new veneer to cabinet boxes
   - Install new doors and drawer fronts
   - Install new hardware (client selected)

3. COUNTERTOPS
   - Template and fabricate quartz countertops
   - Install with undermount sink

4. BACKSPLASH
   - Install subway tile backsplash
   - Grout and seal

5. FLOORING
   - Install LVP flooring
   - Install transitions

6. FINISH
   - Touch-up paint as needed
   - Final cleaning

EXCLUSIONS:
- New appliances
- Electrical modifications
- Plumbing modifications (keeping existing layout)
`,
    markupPercent: 15,
    createdAt: daysAgo(14),
    sentAt: daysAgo(13),
    viewedAt: daysAgo(12),
    acceptedAt: daysAgo(10),
    validUntil: daysFromNow(16),
  },

  // 10. Thompson Garage Addition
  {
    id: 'demo-est-thompson-garage',
    number: 'EST-2025-010',
    name: 'Thompson Garage Addition',
    client: { ...DEMO_CLIENTS.thompson },
    projectId: 'demo-proj-thompson-garage',
    projectAddress: { street: '890 Pine Road', city: 'Aurora', state: 'CO', zip: '80012' },
    status: 'accepted',
    lineItemTemplates: GARAGE_ADDITION_ITEMS,
    scopeOfWork: `SCOPE OF WORK - Attached Garage Addition

1. PERMITS & SITE WORK
   - Obtain building permit
   - Excavation and grading
   - Utility coordination

2. FOUNDATION
   - Pour concrete footings per engineer
   - Pour 4" slab with wire mesh
   - Stem wall construction

3. FRAMING
   - Frame walls with proper sheathing
   - Frame roof to match existing home
   - Install house wrap

4. EXTERIOR
   - Install siding to match existing
   - Install fascia, soffit, and trim
   - Paint exterior to match

5. ROOFING
   - Install shingles to match existing
   - Flash and tie into existing roof

6. GARAGE DOOR
   - Install 16'x7' insulated steel door
   - Install garage door opener

7. ELECTRICAL
   - Install subpanel
   - Lighting and outlets per code
   - Exterior lights

8. DRYWALL & PAINT
   - Fire-rated drywall where required
   - Level 4 finish, paint walls

9. ENTRY
   - Install entry door to house
   - Exterior man door

EXCLUSIONS:
- Driveway extension (separate quote available)
- Interior organization systems
`,
    markupPercent: 15,
    createdAt: daysAgo(21),
    sentAt: daysAgo(20),
    viewedAt: daysAgo(19),
    acceptedAt: daysAgo(14),
    validUntil: daysFromNow(9),
    notes: 'Will start after deck project completes.',
  },

  // 11. Smith Bathroom Remodel
  {
    id: 'demo-est-smith-bathroom',
    number: 'EST-2025-011',
    name: 'Smith Bathroom Remodel',
    client: DEMO_CLIENTS.smith,
    projectId: 'demo-proj-smith-bathroom',
    projectAddress: { street: '1234 Maple Street', city: 'Denver', state: 'CO', zip: '80202' },
    status: 'accepted',
    lineItemTemplates: BATHROOM_REMODEL_ITEMS.slice(0, 16), // Guest bath subset
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.bathroomRemodel,
    markupPercent: 15,
    createdAt: daysAgo(45),
    sentAt: daysAgo(44),
    viewedAt: daysAgo(42),
    acceptedAt: daysAgo(38),
    validUntil: daysAgo(14),
    notes: 'Return customer from kitchen project.',
  },

  // 12. Wilson Pool House
  {
    id: 'demo-est-wilson-pool',
    number: 'EST-2025-012',
    name: 'Wilson Pool House',
    client: { ...DEMO_CLIENTS.wilson },
    projectId: 'demo-proj-wilson-pool',
    projectAddress: { street: '234 Birch Lane', city: 'Centennial', state: 'CO', zip: '80112' },
    status: 'accepted',
    lineItemTemplates: POOL_HOUSE_ITEMS,
    scopeOfWork: `SCOPE OF WORK - Pool House Construction

1. SITE PREP & FOUNDATION
   - Excavation and grading
   - Pour concrete slab foundation

2. FRAMING
   - Frame walls and roof with exposed beams
   - Install sheathing

3. EXTERIOR
   - Install board and batten siding
   - Install standing seam metal roofing
   - Install windows and doors including bi-fold patio doors

4. ELECTRICAL
   - Run electrical service to pool house
   - Install outlets, lighting, ceiling fans

5. PLUMBING
   - Run water line from house
   - Install outdoor shower
   - Install bathroom (toilet, vanity)

6. INTERIOR
   - Tongue and groove ceiling
   - Drywall and finish
   - Polished concrete floor
   - Bathroom tile

7. KITCHENETTE
   - Install mini kitchen cabinets
   - Countertop and sink

8. FINISH
   - Paint interior and exterior
   - Final inspection

EXCLUSIONS:
- Appliances
- Pool connection work
- Landscaping
`,
    markupPercent: 15,
    createdAt: daysAgo(60),
    sentAt: daysAgo(59),
    viewedAt: daysAgo(57),
    acceptedAt: daysAgo(52),
    validUntil: daysAgo(29),
    notes: 'Project on hold pending permit variance approval.',
  },
];

// ============================================
// PENDING ESTIMATES (3) - Awaiting Client Response
// ============================================

const pendingEstimates: DemoEstimate[] = [
  // 13. Johnson Home Office Addition
  {
    id: 'demo-est-pending-1',
    number: 'EST-2025-013',
    name: 'Johnson Home Office Addition',
    client: {
      id: 'demo-client-johnson',
      firstName: 'David',
      lastName: 'Johnson',
      email: 'david.johnson@email.demo',
      phone: '(303) 555-1010',
      isCommercial: false,
      address: { street: '456 Spruce Way', city: 'Westminster', state: 'CO', zip: '80031' },
    },
    projectAddress: { street: '456 Spruce Way', city: 'Westminster', state: 'CO', zip: '80031' },
    status: 'viewed',
    lineItemTemplates: [
      { description: 'Excavation and site prep', category: 'Site Work', laborHours: 12, materialsCost: 400, unit: 'ls', quantity: 1 },
      { description: 'Pour concrete slab foundation', category: 'Concrete', laborHours: 16, materialsCost: 2800, unit: 'sf', quantity: 200 },
      { description: 'Frame walls and roof', category: 'Framing', laborHours: 40, materialsCost: 4500, unit: 'ls', quantity: 1 },
      { description: 'Install siding to match', category: 'Exterior', laborHours: 20, materialsCost: 2800, unit: 'sf', quantity: 400 },
      { description: 'Install roofing', category: 'Roofing', laborHours: 16, materialsCost: 1800, unit: 'sf', quantity: 220 },
      { description: 'Windows and entry door', category: 'Windows', laborHours: 8, materialsCost: 2400, unit: 'ea', quantity: 4 },
      { description: 'Electrical rough and finish', category: 'Electrical', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
      { description: 'HVAC mini-split system', category: 'HVAC', laborHours: 8, materialsCost: 3200, unit: 'ea', quantity: 1 },
      { description: 'Drywall and paint', category: 'Drywall', laborHours: 24, materialsCost: 1200, unit: 'sf', quantity: 600 },
      { description: 'Install LVP flooring', category: 'Flooring', laborHours: 8, materialsCost: 1400, unit: 'sf', quantity: 200 },
      { description: 'Install trim and final details', category: 'Finish', laborHours: 12, materialsCost: 600, unit: 'ls', quantity: 1 },
    ],
    scopeOfWork: `SCOPE OF WORK - Home Office Addition

200 SF detached home office with HVAC, electrical, and premium finishes.

Includes:
- Foundation and framing
- Exterior to match existing home
- Mini-split HVAC system
- Full electrical with dedicated circuits
- Premium LVP flooring
- Drywall and paint

EXCLUSIONS:
- Permit fees
- Data/networking
- Furniture
`,
    markupPercent: 15,
    createdAt: daysAgo(5),
    sentAt: daysAgo(4),
    viewedAt: daysAgo(2),
    validUntil: daysFromNow(26),
    notes: 'Client viewed estimate 2 days ago. Following up tomorrow.',
  },

  // 14. Martinez Patio Cover
  {
    id: 'demo-est-pending-2',
    number: 'EST-2025-014',
    name: 'Martinez Patio Cover',
    client: {
      id: 'demo-client-martinez',
      firstName: 'Ana',
      lastName: 'Martinez',
      email: 'ana.martinez@email.demo',
      phone: '(303) 555-1011',
      isCommercial: false,
      address: { street: '789 Elm Street', city: 'Thornton', state: 'CO', zip: '80229' },
    },
    projectAddress: { street: '789 Elm Street', city: 'Thornton', state: 'CO', zip: '80229' },
    status: 'sent',
    lineItemTemplates: [
      { description: 'Layout and dig post holes', category: 'Site Work', laborHours: 8, materialsCost: 0, unit: 'ls', quantity: 1 },
      { description: 'Set posts in concrete (6 posts)', category: 'Concrete', laborHours: 8, materialsCost: 720, unit: 'ea', quantity: 6 },
      { description: 'Install beams and rafters', category: 'Framing', laborHours: 24, materialsCost: 1800, unit: 'ls', quantity: 1 },
      { description: 'Install aluminum patio cover panels', category: 'Roofing', laborHours: 16, materialsCost: 3600, unit: 'sf', quantity: 300 },
      { description: 'Install fascia and trim', category: 'Exterior', laborHours: 8, materialsCost: 480, unit: 'lf', quantity: 60 },
      { description: 'Install ceiling fan electrical', category: 'Electrical', laborHours: 6, materialsCost: 280, unit: 'ea', quantity: 2 },
      { description: 'Paint posts and trim', category: 'Paint', laborHours: 4, materialsCost: 120, unit: 'ls', quantity: 1 },
    ],
    scopeOfWork: `SCOPE OF WORK - Attached Patio Cover

300 SF attached aluminum patio cover with ceiling fan rough-in.

Includes:
- 6 post structure
- Aluminum roof panels
- Fascia and trim
- Electrical for 2 ceiling fans
- Paint to match house

EXCLUSIONS:
- Ceiling fans (by owner)
- Lighting fixtures
- Permit (if required)
`,
    markupPercent: 12,
    createdAt: daysAgo(3),
    sentAt: daysAgo(2),
    validUntil: daysFromNow(28),
    notes: 'Sent estimate, waiting for client to review.',
  },

  // 15. Anderson Bathroom Update
  {
    id: 'demo-est-pending-3',
    number: 'EST-2025-015',
    name: 'Anderson Hall Bath Update',
    client: {
      id: 'demo-client-anderson',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@email.demo',
      phone: '(303) 555-1012',
      isCommercial: false,
      address: { street: '321 Walnut Drive', city: 'Arvada', state: 'CO', zip: '80002' },
    },
    projectAddress: { street: '321 Walnut Drive', city: 'Arvada', state: 'CO', zip: '80002' },
    status: 'viewed',
    lineItemTemplates: BATHROOM_REMODEL_ITEMS.slice(0, 14),
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.bathroomRemodel,
    markupPercent: 15,
    createdAt: daysAgo(7),
    sentAt: daysAgo(6),
    viewedAt: daysAgo(4),
    validUntil: daysFromNow(24),
    notes: 'Client is comparing with one other contractor.',
  },
];

// ============================================
// DECLINED ESTIMATES (2) - With Decline Reasons
// ============================================

const declinedEstimates: DemoEstimate[] = [
  // 16. Roberts Kitchen - Declined (too expensive)
  {
    id: 'demo-est-declined-1',
    number: 'EST-2025-016',
    name: 'Roberts Kitchen Remodel',
    client: {
      id: 'demo-client-roberts',
      firstName: 'Kevin',
      lastName: 'Roberts',
      email: 'kevin.roberts@email.demo',
      phone: '(303) 555-1020',
      isCommercial: false,
      address: { street: '555 Aspen Court', city: 'Golden', state: 'CO', zip: '80401' },
    },
    projectAddress: { street: '555 Aspen Court', city: 'Golden', state: 'CO', zip: '80401' },
    status: 'declined',
    lineItemTemplates: KITCHEN_REMODEL_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.kitchenRemodel,
    markupPercent: 15,
    createdAt: daysAgo(45),
    sentAt: daysAgo(44),
    viewedAt: daysAgo(42),
    declinedAt: daysAgo(38),
    declineReason: 'Budget constraints - client mentioned the quote was higher than expected. They may revisit in 6 months after saving more.',
    validUntil: daysAgo(14),
    notes: 'Follow up in 6 months. Client was professional and appreciative.',
  },

  // 17. Chen Deck - Declined (going with competitor)
  {
    id: 'demo-est-declined-2',
    number: 'EST-2025-017',
    name: 'Chen Backyard Deck',
    client: {
      id: 'demo-client-chen',
      firstName: 'Wei',
      lastName: 'Chen',
      email: 'wei.chen@email.demo',
      phone: '(303) 555-1021',
      isCommercial: false,
      address: { street: '888 Poplar Lane', city: 'Parker', state: 'CO', zip: '80134' },
    },
    projectAddress: { street: '888 Poplar Lane', city: 'Parker', state: 'CO', zip: '80134' },
    status: 'declined',
    lineItemTemplates: DECK_BUILD_ITEMS,
    scopeOfWork: SCOPE_OF_WORK_TEMPLATES.deckBuild,
    markupPercent: 15,
    createdAt: daysAgo(30),
    sentAt: daysAgo(29),
    viewedAt: daysAgo(27),
    declinedAt: daysAgo(20),
    declineReason: 'Client chose another contractor who could start 2 weeks earlier. Scheduling was the deciding factor, not price.',
    validUntil: daysFromNow(0),
    notes: 'Lost due to scheduling. Consider capacity planning for busy season.',
  },
];

// ============================================
// DRAFT ESTIMATE (1) - In Progress
// ============================================

const draftEstimates: DemoEstimate[] = [
  // 18. Taylor Basement (Draft)
  {
    id: 'demo-est-draft-1',
    number: 'EST-2025-018',
    name: 'Taylor Basement Finish',
    client: {
      id: 'demo-client-taylor',
      firstName: 'Ryan',
      lastName: 'Taylor',
      email: 'ryan.taylor@email.demo',
      phone: '(303) 555-1030',
      isCommercial: false,
      address: { street: '999 Cherry Lane', city: 'Castle Rock', state: 'CO', zip: '80108' },
    },
    projectAddress: { street: '999 Cherry Lane', city: 'Castle Rock', state: 'CO', zip: '80108' },
    status: 'draft',
    lineItemTemplates: BASEMENT_FINISH_ITEMS,
    scopeOfWork: `SCOPE OF WORK - Basement Finish (DRAFT)

[In Progress - Site visit completed yesterday]

Preliminary scope:
- ~1,000 SF finish
- 2 bedrooms (egress required)
- 1 full bathroom
- Recreation/media room
- Wet bar area (TBD)

Notes from site visit:
- Existing plumbing stub for bathroom
- HVAC can be extended from existing
- One egress window needed
- Possible moisture issue in NW corner - need to investigate

TO DO:
- Finalize room layout with client
- Get egress window quote
- Address moisture concern
- Finalize selections
`,
    markupPercent: 15,
    createdAt: daysAgo(1),
    validUntil: daysFromNow(30),
    notes: 'Site visit completed. Need to finalize scope with client before sending.',
  },
];

// ============================================
// Combine All Estimates
// ============================================

const allEstimates: DemoEstimate[] = [
  ...acceptedEstimates,
  ...pendingEstimates,
  ...declinedEstimates,
  ...draftEstimates,
];

// ============================================
// Seed Function
// ============================================

async function seedEstimates(): Promise<void> {
  logSection('Seeding Demo Estimates');
  logProgress(`Creating ${allEstimates.length} estimates...`);

  const batch = db.batch();
  // NOTE: Estimates are stored in top-level 'estimates' collection with orgId field
  // NOT in organizations/{orgId}/estimates subcollection
  const estimatesRef = db.collection('estimates');

  for (const estimate of allEstimates) {
    const lineItems = createLineItems(estimate.lineItemTemplates, estimate.markupPercent);
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    const total = Math.round(subtotal * 100) / 100;

    const estimateRef = estimatesRef.doc(estimate.id);
    const estimateData = {
      id: estimate.id,
      orgId: DEMO_ORG_ID,
      number: estimate.number,
      name: estimate.name,
      description: estimate.notes || '',
      status: estimate.status,

      // Client info
      clientId: estimate.client.id,
      clientName: `${estimate.client.firstName} ${estimate.client.lastName}`,
      clientEmail: estimate.client.email,
      clientPhone: estimate.client.phone,
      clientAddress: `${estimate.client.address.street}, ${estimate.client.address.city}, ${estimate.client.address.state} ${estimate.client.address.zip}`,

      // Project info
      projectId: estimate.projectId || null,
      projectName: estimate.name,
      projectAddress: `${estimate.projectAddress.street}, ${estimate.projectAddress.city}, ${estimate.projectAddress.state} ${estimate.projectAddress.zip}`,

      // Line items
      lineItems,

      // Pricing
      subtotal,
      total,
      markupPercent: estimate.markupPercent,

      // Payment terms
      paymentTerms: 'Net 30. 50% deposit required to begin work.',
      depositRequired: Math.round(total * 0.5 * 100) / 100,
      depositPercent: 50,

      // Validity
      validUntil: toTimestamp(estimate.validUntil),
      expirationDays: 30,

      // Scope
      scopeOfWork: estimate.scopeOfWork,
      exclusions: 'Permits (if required, billed at cost). Work outside scope requires change order.',
      notes: estimate.notes || '',
      termsAndConditions: 'Standard terms and conditions apply. See attached document.',

      // Tracking
      sentAt: estimate.sentAt ? toTimestamp(estimate.sentAt) : null,
      viewedAt: estimate.viewedAt ? toTimestamp(estimate.viewedAt) : null,
      acceptedAt: estimate.acceptedAt ? toTimestamp(estimate.acceptedAt) : null,
      declinedAt: estimate.declinedAt ? toTimestamp(estimate.declinedAt) : null,
      declineReason: estimate.declineReason || null,

      // Signature (for accepted estimates)
      signedAt: estimate.acceptedAt ? toTimestamp(estimate.acceptedAt) : null,
      signedBy: estimate.acceptedAt ? `${estimate.client.firstName} ${estimate.client.lastName}` : null,

      // Revision tracking
      revisionNumber: 1,
      previousVersionId: null,

      // Created by
      createdBy: DEMO_USERS.pm.uid,
      createdByName: DEMO_USERS.pm.displayName,
      createdAt: toTimestamp(estimate.createdAt),
      updatedAt: toTimestamp(new Date()),

      isDemoData: true,
    };

    batch.set(estimateRef, estimateData);
  }

  await batch.commit();

  logSuccess(`Created ${allEstimates.length} estimates`);

  // Summary
  logSection('Estimates Summary');
  console.log(`  Accepted: ${acceptedEstimates.length}`);
  console.log(`  Pending:  ${pendingEstimates.length}`);
  console.log(`  Declined: ${declinedEstimates.length}`);
  console.log(`  Draft:    ${draftEstimates.length}`);
  console.log(`  ─────────────────────`);
  console.log(`  Total:    ${allEstimates.length}`);

  // Calculate total value
  const acceptedValue = acceptedEstimates.reduce((sum, est) => {
    const items = createLineItems(est.lineItemTemplates, est.markupPercent);
    return sum + items.reduce((s, i) => s + i.totalCost, 0);
  }, 0);
  const pendingValue = pendingEstimates.reduce((sum, est) => {
    const items = createLineItems(est.lineItemTemplates, est.markupPercent);
    return sum + items.reduce((s, i) => s + i.totalCost, 0);
  }, 0);

  console.log(`\n  Accepted Value: $${acceptedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`  Pending Value:  $${pendingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
}

// ============================================
// Export for use by other seed scripts
// ============================================

export { allEstimates, acceptedEstimates, pendingEstimates, declinedEstimates, draftEstimates };

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedEstimates()
    .then(() => {
      console.log('\n✅ Estimates seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding estimates:', error);
      process.exit(1);
    });
}
