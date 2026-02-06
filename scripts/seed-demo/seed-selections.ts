#!/usr/bin/env ts-node
/**
 * Seed Demo Selections
 *
 * Creates 20 material/design selections across 4 projects with realistic
 * construction categories, options, pricing, and budget variances.
 *
 * Usage:
 *   cd scripts/seed-demo && npx ts-node seed-selections.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  toTimestamp,
  generateId,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

import { getDb } from './db';
const db = getDb();

// ============================================
// Demo Projects for Selections
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
];

// ============================================
// Selection Categories & Options
// ============================================

interface SelectionOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  supplier?: string;
  imageUrl?: string;
  isRecommended?: boolean;
}

interface SelectionTemplate {
  categoryId: string;
  categoryName: string;
  room?: string;
  budgetAmount: number;
  options: SelectionOption[];
  notes?: string;
}

function makeOption(
  name: string,
  price: number,
  supplier: string,
  description?: string,
  isRecommended?: boolean
): SelectionOption {
  return {
    id: generateId('opt'),
    name,
    price,
    supplier,
    description,
    isRecommended: isRecommended || false,
  };
}

// 20 selections distributed across projects
const SELECTION_DATA: Array<{
  projectIndex: number;
  template: SelectionTemplate;
  status: 'pending' | 'selected' | 'approved' | 'ordered' | 'installed';
  clientNote?: string;
}> = [
  // =============================================
  // Smith Kitchen Remodel (6 selections)
  // =============================================
  {
    projectIndex: 0,
    status: 'installed',
    template: {
      categoryId: 'countertops',
      categoryName: 'Countertops',
      room: 'Kitchen',
      budgetAmount: 4500,
      notes: 'Need 42 SF including island. Edge profile TBD.',
      options: [
        makeOption('Calacatta Classique Quartz', 4800, 'Cambria', '3cm quartz with veining, polished finish', true),
        makeOption('Black Galaxy Granite', 3900, 'MSI Surfaces', '3cm natural granite, polished'),
        makeOption('White Carrara Marble', 5200, 'Arizona Tile', '3cm honed marble, classic white'),
        makeOption('Maple Butcher Block', 2800, 'John Boos', '1.75" edge grain maple, food safe finish'),
      ],
    },
  },
  {
    projectIndex: 0,
    status: 'installed',
    template: {
      categoryId: 'cabinets',
      categoryName: 'Cabinets',
      room: 'Kitchen',
      budgetAmount: 12000,
      notes: 'Shaker style preferred. Soft-close required.',
      options: [
        makeOption('Custom Shaker - Painted White', 14500, 'Summit Cabinetry', 'Full custom, dovetail drawers, soft-close', true),
        makeOption('Semi-Custom Shaker - White', 9800, 'KraftMaid', 'Semi-custom with plywood box construction'),
        makeOption('Stock Shaker - White', 6200, 'Hampton Bay', 'Stock cabinets, particleboard box'),
      ],
    },
    clientNote: 'We prefer the custom option if budget allows',
  },
  {
    projectIndex: 0,
    status: 'ordered',
    template: {
      categoryId: 'flooring',
      categoryName: 'Flooring',
      room: 'Kitchen',
      budgetAmount: 3200,
      notes: 'Waterproof required for kitchen. Approx 180 SF.',
      options: [
        makeOption('European Oak LVP', 3400, 'Shaw Floors', '7mm waterproof LVP with attached pad'),
        makeOption('Porcelain Wood-Look Tile', 4100, 'Daltile', '8x48 wood-look porcelain, grout included'),
        makeOption('Natural Hickory Hardwood', 5800, 'Armstrong', '5" engineered hardwood, site-finished', false),
        makeOption('Classic Oak LVP', 2600, 'Mohawk', '5mm waterproof, click-lock install'),
      ],
    },
  },
  {
    projectIndex: 0,
    status: 'approved',
    template: {
      categoryId: 'light-fixtures',
      categoryName: 'Light Fixtures',
      room: 'Kitchen',
      budgetAmount: 1800,
      notes: '3 pendants over island, recessed cans throughout.',
      options: [
        makeOption('Industrial Pendant Set (3)', 1650, 'Kichler', 'Brushed nickel, clear glass, Edison bulb'),
        makeOption('Modern Globe Pendant Set (3)', 2100, 'West Elm', 'Brass finish, frosted glass spheres', true),
        makeOption('Farmhouse Lantern Pendant Set (3)', 1400, 'Progress Lighting', 'Black iron frame, seeded glass'),
      ],
    },
  },
  {
    projectIndex: 0,
    status: 'selected',
    template: {
      categoryId: 'hardware',
      categoryName: 'Hardware',
      room: 'Kitchen',
      budgetAmount: 650,
      notes: '32 pulls, 8 knobs needed. Must match pendant finish.',
      options: [
        makeOption('Brushed Nickel Bar Pulls', 580, 'Amerock', '5" center-to-center, modern bar style', true),
        makeOption('Matte Black Cup Pulls', 720, 'Top Knobs', '4" cup pulls, farmhouse style'),
        makeOption('Polished Chrome T-Bar', 490, 'Liberty', '5" T-bar pulls, contemporary'),
      ],
    },
  },
  {
    projectIndex: 0,
    status: 'pending',
    template: {
      categoryId: 'paint',
      categoryName: 'Paint Colors',
      room: 'Kitchen',
      budgetAmount: 800,
      notes: 'Walls and ceiling. Semi-gloss for trim.',
      options: [
        makeOption('Agreeable Gray SW 7029', 750, 'Sherwin-Williams', 'Warm greige, eggshell finish', true),
        makeOption('Revere Pewter HC-172', 820, 'Benjamin Moore', 'Classic warm gray, matte finish'),
        makeOption('Simply White OC-117', 820, 'Benjamin Moore', 'Crisp white with warm undertone'),
        makeOption('Alabaster SW 7008', 750, 'Sherwin-Williams', 'Creamy off-white, eggshell'),
      ],
    },
  },

  // =============================================
  // Garcia Master Bath (5 selections)
  // =============================================
  {
    projectIndex: 1,
    status: 'approved',
    template: {
      categoryId: 'tile',
      categoryName: 'Tile',
      room: 'Master Bath - Shower',
      budgetAmount: 2800,
      notes: 'Walk-in shower walls and floor. Need waterproofing.',
      options: [
        makeOption('White Subway 3x12', 2200, 'Daltile', 'Glossy white, stacked bond pattern'),
        makeOption('Marble Hexagon Mosaic', 3600, 'MSI Surfaces', '2" Carrara hex for floor, subway for walls', true),
        makeOption('Large Format 24x48 Porcelain', 3100, 'Arizona Tile', 'Minimal grout lines, modern look'),
      ],
    },
    clientNote: 'Love the marble hex for the shower floor!',
  },
  {
    projectIndex: 1,
    status: 'ordered',
    template: {
      categoryId: 'plumbing-fixtures',
      categoryName: 'Plumbing Fixtures',
      room: 'Master Bath',
      budgetAmount: 3500,
      notes: 'Rain shower head, dual vanity faucets, toilet.',
      options: [
        makeOption('Moen Align Collection (Full Set)', 3200, 'Moen', 'Rain head, handshower, 2 faucets, toilet', true),
        makeOption('Kohler Purist Collection (Full Set)', 4100, 'Kohler', 'Premium rain system, widespread faucets'),
        makeOption('Delta Trinsic Collection (Full Set)', 2800, 'Delta', 'Monitor shower, centerset faucets'),
      ],
    },
  },
  {
    projectIndex: 1,
    status: 'selected',
    template: {
      categoryId: 'countertops',
      categoryName: 'Countertops',
      room: 'Master Bath - Vanity',
      budgetAmount: 1800,
      notes: 'Double vanity top, 60" with two undermount sinks.',
      options: [
        makeOption('White Quartz Vanity Top', 1950, 'Cambria', 'Pre-fab 61" with undermount cutouts'),
        makeOption('Cultured Marble Vanity Top', 1200, 'US Marble', 'Integrated bowls, easy maintenance'),
        makeOption('Natural Marble Vanity Top', 2600, 'Arizona Tile', 'Custom cut Carrara, polished', false),
      ],
    },
  },
  {
    projectIndex: 1,
    status: 'approved',
    template: {
      categoryId: 'light-fixtures',
      categoryName: 'Light Fixtures',
      room: 'Master Bath',
      budgetAmount: 900,
      notes: 'Vanity light bar and recessed shower can.',
      options: [
        makeOption('3-Light Vanity Bar - Chrome', 780, 'Progress Lighting', '24" chrome with frosted glass', true),
        makeOption('4-Light Vanity Bar - Brushed Nickel', 920, 'Kichler', '32" brushed nickel, clear glass'),
        makeOption('LED Vanity Mirror + Recessed Can', 1100, 'WAC Lighting', 'Backlit mirror eliminates vanity bar'),
      ],
    },
  },
  {
    projectIndex: 1,
    status: 'pending',
    template: {
      categoryId: 'flooring',
      categoryName: 'Flooring',
      room: 'Master Bath',
      budgetAmount: 1400,
      notes: 'Heated floor required. ~80 SF.',
      options: [
        makeOption('Porcelain 12x24 - Light Gray', 1350, 'Daltile', 'Rectified edges, slip-resistant', true),
        makeOption('Marble Mosaic - Basketweave', 2100, 'MSI Surfaces', 'Carrara with gray dot accent'),
        makeOption('LVP - Stone Look', 900, 'COREtec', 'Waterproof vinyl, heated floor compatible'),
      ],
    },
  },

  // =============================================
  // Main St. Retail Storefront (5 selections)
  // =============================================
  {
    projectIndex: 2,
    status: 'ordered',
    template: {
      categoryId: 'flooring',
      categoryName: 'Flooring',
      room: 'Main Sales Floor',
      budgetAmount: 8500,
      notes: 'High-traffic commercial grade. ~2400 SF.',
      options: [
        makeOption('Polished Concrete', 7200, 'Colorado Concrete', 'Existing slab polished and sealed, low maintenance'),
        makeOption('Commercial LVT - Wood Look', 9600, 'Shaw Contract', 'Glue-down LVT, 20mil wear layer', true),
        makeOption('Large Format Porcelain', 12400, 'Daltile', '24x48 rectified, commercial rated'),
      ],
    },
  },
  {
    projectIndex: 2,
    status: 'approved',
    template: {
      categoryId: 'light-fixtures',
      categoryName: 'Light Fixtures',
      room: 'Sales Floor',
      budgetAmount: 6500,
      notes: 'Track lighting for display areas, recessed for general.',
      options: [
        makeOption('LED Track System - 24 Heads', 5800, 'WAC Lighting', 'Adjustable heads, 3000K, dimmable', true),
        makeOption('Recessed LED Grid - 30 Fixtures', 7200, 'Lithonia', '2x2 flat panel LED, commercial grade'),
        makeOption('Pendant + Track Combo', 8400, 'Tech Lighting', 'Decorative pendants over counter, track elsewhere'),
      ],
    },
  },
  {
    projectIndex: 2,
    status: 'selected',
    template: {
      categoryId: 'paint',
      categoryName: 'Paint Colors',
      room: 'Retail Space',
      budgetAmount: 2200,
      notes: 'Accent wall behind register, neutral for rest.',
      options: [
        makeOption('Commercial White + Navy Accent', 2000, 'Sherwin-Williams', 'Extra White walls, Naval SW 6244 accent', true),
        makeOption('Warm Gray + Charcoal Accent', 2100, 'Benjamin Moore', 'Classic Gray walls, Wrought Iron accent'),
        makeOption('All White - Gallery Style', 1800, 'Sherwin-Williams', 'Pure White throughout, gallery-clean aesthetic'),
      ],
    },
    clientNote: 'Navy accent matches our brand colors',
  },
  {
    projectIndex: 2,
    status: 'selected',
    template: {
      categoryId: 'hardware',
      categoryName: 'Hardware',
      room: 'Storefront',
      budgetAmount: 3800,
      notes: 'Commercial door hardware, display fixtures, ADA compliant.',
      options: [
        makeOption('Commercial Entry Hardware Set', 3400, 'Schlage', 'ADA lever, panic bar, closer, automatic opener'),
        makeOption('Premium Entry Hardware Set', 4600, 'Von Duprin', 'Designer lever, concealed closer, touchless sensor', true),
      ],
    },
  },
  {
    projectIndex: 2,
    status: 'pending',
    template: {
      categoryId: 'countertops',
      categoryName: 'Countertops',
      room: 'Checkout Counter',
      budgetAmount: 2400,
      notes: 'ADA-height checkout counter with display case.',
      options: [
        makeOption('Quartz - Gray Mist', 2600, 'Cambria', 'Commercial grade, 3cm with waterfall edge'),
        makeOption('Solid Surface - White', 1800, 'Corian', 'Seamless integration, easy repair', true),
        makeOption('Laminate - Wood Grain', 1200, 'Wilsonart', 'Commercial grade HPL, cost effective'),
      ],
    },
  },

  // =============================================
  // Downtown Cafe TI (4 selections)
  // =============================================
  {
    projectIndex: 3,
    status: 'ordered',
    template: {
      categoryId: 'tile',
      categoryName: 'Tile',
      room: 'Cafe - Restrooms',
      budgetAmount: 1800,
      notes: 'Floor and wainscot in two restrooms. ADA compliant.',
      options: [
        makeOption('Subway + Hex Floor Combo', 1650, 'Daltile', 'White subway walls, black hex floor, classic look', true),
        makeOption('Large Format Porcelain', 2200, 'Arizona Tile', '12x24 walls and floor, modern minimal'),
        makeOption('Cement Look Porcelain', 1900, 'MSI Surfaces', '8x8 patterned, Mediterranean style'),
      ],
    },
  },
  {
    projectIndex: 3,
    status: 'approved',
    template: {
      categoryId: 'light-fixtures',
      categoryName: 'Light Fixtures',
      room: 'Dining Area',
      budgetAmount: 4200,
      notes: 'Warm ambiance for dining. Mix of pendants and downlights.',
      options: [
        makeOption('Industrial Pendant Cluster (8)', 3800, 'Restoration Hardware', 'Aged brass, Edison bulbs, varied heights', true),
        makeOption('Modern Globe Pendants (8)', 4500, 'West Elm', 'Milk glass globes, brushed brass'),
        makeOption('Recessed LED Warm Grid (16)', 3200, 'Halo', '3000K dimmable, clean ceiling aesthetic'),
      ],
    },
  },
  {
    projectIndex: 3,
    status: 'selected',
    template: {
      categoryId: 'plumbing-fixtures',
      categoryName: 'Plumbing Fixtures',
      room: 'Restrooms',
      budgetAmount: 2200,
      notes: 'Commercial grade, ADA, touchless preferred.',
      options: [
        makeOption('Touchless Sensor Package', 2400, 'Sloan', 'Sensor faucets, flush valves, soap dispensers', true),
        makeOption('Standard Commercial Package', 1600, 'American Standard', 'Manual faucets, standard flush'),
        makeOption('Premium Touchless Package', 3100, 'Kohler', 'Touchless everything, premium finishes'),
      ],
    },
  },
  {
    projectIndex: 3,
    status: 'pending',
    template: {
      categoryId: 'flooring',
      categoryName: 'Flooring',
      room: 'Dining Area',
      budgetAmount: 5500,
      notes: 'High-traffic, food service environment. ~1200 SF.',
      options: [
        makeOption('Polished Concrete - Stained', 4800, 'Colorado Concrete', 'Acid-stained, sealed, easy to clean', true),
        makeOption('Commercial Porcelain Tile', 6800, 'Daltile', 'Slip-resistant, wood look, 6x36'),
        makeOption('Luxury Vinyl Plank', 5200, 'Mannington', 'Commercial 28mil wear, waterproof'),
      ],
    },
  },
];

// ============================================
// Main Seeding Function
// ============================================

async function seedSelections(): Promise<number> {
  logSection('Seeding Demo Selections');

  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const selectionsRef = orgRef.collection('selections');

  const selections: any[] = [];

  for (const item of SELECTION_DATA) {
    const project = DEMO_PROJECTS[item.projectIndex];
    const template = item.template;
    const status = item.status;

    // Determine selected option and pricing based on status
    let selectedOptionId: string | undefined;
    let selectedOptionName: string | undefined;
    let selectedPrice: number | undefined;
    let selectedBy: string | undefined;
    let selectedByName: string | undefined;
    let selectedAt: Date | undefined;
    let approvedBy: string | undefined;
    let approvedAt: Date | undefined;
    let orderedAt: Date | undefined;
    let installedAt: Date | undefined;

    // For non-pending statuses, pick an option (prefer recommended, otherwise first)
    if (status !== 'pending') {
      const recommended = template.options.find((o) => o.isRecommended);
      const chosen = recommended || template.options[0];
      selectedOptionId = chosen.id;
      selectedOptionName = chosen.name;
      selectedPrice = chosen.price;
      selectedBy = DEMO_USERS.owner.uid;
      selectedByName = DEMO_USERS.owner.displayName;
      selectedAt = daysAgo(Math.floor(Math.random() * 20) + 30);

      if (status === 'approved' || status === 'ordered' || status === 'installed') {
        approvedBy = DEMO_USERS.pm.uid;
        approvedAt = daysAgo(Math.floor(Math.random() * 10) + 20);
      }

      if (status === 'ordered' || status === 'installed') {
        orderedAt = daysAgo(Math.floor(Math.random() * 5) + 12);
      }

      if (status === 'installed') {
        installedAt = daysAgo(Math.floor(Math.random() * 5) + 3);
      }
    }

    // Calculate budget variance
    const budgetVariance = selectedPrice
      ? selectedPrice - template.budgetAmount
      : 0;

    const selectionId = generateId('sel');

    const createdAt = daysAgo(Math.floor(Math.random() * 20) + 40);

    const selection = {
      id: selectionId,
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      categoryId: template.categoryId,
      categoryName: template.categoryName,
      status,
      selectedOptionId: selectedOptionId || null,
      selectedOptionName: selectedOptionName || null,
      selectedPrice: selectedPrice || null,
      budgetAmount: template.budgetAmount,
      budgetVariance,
      options: template.options,
      room: template.room || null,
      notes: template.notes || null,
      clientNote: item.clientNote || null,
      selectedBy: selectedBy || null,
      selectedByName: selectedByName || null,
      selectedAt: selectedAt || null,
      approvedBy: approvedBy || null,
      approvedAt: approvedAt || null,
      orderedAt: orderedAt || null,
      installedAt: installedAt || null,
      createdBy: DEMO_USERS.pm.uid,
      createdAt,
      updatedAt: null,
      isDemoData: true,
    };

    selections.push(selection);

    const variance = budgetVariance > 0
      ? `+$${budgetVariance.toLocaleString()}`
      : budgetVariance < 0
        ? `-$${Math.abs(budgetVariance).toLocaleString()}`
        : '$0';

    logProgress(
      `[${status.toUpperCase().padEnd(9)}] ${template.categoryName} — ${project.name} (${variance})`
    );
  }

  // Write all selections using batch writes
  await executeBatchWrites(
    db,
    selections,
    (batch, selection) => {
      const ref = selectionsRef.doc(selection.id);
      batch.set(ref, {
        ...selection,
        selectedAt: selection.selectedAt ? toTimestamp(selection.selectedAt) : null,
        approvedAt: selection.approvedAt ? toTimestamp(selection.approvedAt) : null,
        orderedAt: selection.orderedAt ? toTimestamp(selection.orderedAt) : null,
        installedAt: selection.installedAt ? toTimestamp(selection.installedAt) : null,
        createdAt: toTimestamp(selection.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Selections'
  );

  // Summary
  const statusCounts = selections.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  logSuccess(`Created ${selections.length} selections`);
  logProgress(`Status distribution: ${JSON.stringify(statusCounts)}`);

  const overBudget = selections.filter((s) => s.budgetVariance > 0).length;
  const underBudget = selections.filter((s) => s.budgetVariance < 0).length;
  const onBudget = selections.filter((s) => s.budgetVariance === 0).length;
  logProgress(`Budget: ${overBudget} over, ${underBudget} under, ${onBudget} on budget`);

  return selections.length;
}

// Run if executed directly
if (require.main === module) {
  seedSelections()
    .then((count) => {
      console.log(`\nCreated ${count} selections`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding selections:', error);
      process.exit(1);
    });
}

export { seedSelections };
