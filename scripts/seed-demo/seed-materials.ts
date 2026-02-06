/**
 * Seed Materials, Suppliers, and Purchase Orders for Demo Organization
 * Creates construction materials inventory, supplier directory, and purchase order history
 *
 * Run: npx ts-node seed-materials.ts
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  daysFromNow,
  monthsAgo,
  toTimestamp,
  generateId,
  randomInt,
  randomItem,
  randomAmount,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

// ============================================
// Types
// ============================================

type MaterialCategory = 'lumber' | 'concrete' | 'electrical' | 'plumbing' | 'finishing' | 'hardware';
type MaterialUnit = 'each' | 'sqft' | 'lf' | 'bag' | 'bundle' | 'box';
type POStatus = 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: { street: string; city: string; state: string; zip: string };
  category: string;
  isActive: boolean;
  notes: string;
}

interface MaterialItem {
  id: string;
  name: string;
  description: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  unitCost: number;
  quantity: number;
  minStockLevel: number;
  location: string;
  supplierId: string;
  projectId: string | null;
  isActive: boolean;
}

interface POLineItem {
  materialId: string;
  materialName: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  items: POLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: POStatus;
  orderedBy: string;
  orderedAt: Date;
  expectedDelivery: Date;
}

// ============================================
// Demo Suppliers
// ============================================

const SUPPLIERS: Omit<Supplier, 'id'>[] = [
  {
    name: 'Front Range Lumber Co.',
    contactName: 'Bill Henderson',
    email: 'bill@frontrangelumber.demo',
    phone: '(303) 555-3001',
    address: { street: '4200 Industrial Blvd', city: 'Denver', state: 'CO', zip: '80216' },
    category: 'lumber',
    isActive: true,
    notes: 'Primary lumber supplier. Net 30 terms. 5% discount on orders over $5,000.',
  },
  {
    name: 'Rocky Mountain Concrete Supply',
    contactName: 'Angela Torres',
    email: 'angela@rmconcrete.demo',
    phone: '(303) 555-3002',
    address: { street: '7800 Cement Dr', city: 'Commerce City', state: 'CO', zip: '80022' },
    category: 'concrete',
    isActive: true,
    notes: 'Ready-mix and bagged concrete. Same-day delivery available.',
  },
  {
    name: 'Peak Electrical Distributors',
    contactName: 'Ron Patel',
    email: 'ron@peakelectrical.demo',
    phone: '(303) 555-3003',
    address: { street: '1500 Watt Ave', city: 'Lakewood', state: 'CO', zip: '80228' },
    category: 'electrical',
    isActive: true,
    notes: 'Full electrical supply. Contractor pricing on all wire and panels.',
  },
  {
    name: 'Mile High Plumbing Warehouse',
    contactName: 'Karen Nguyen',
    email: 'karen@milehighplumbing.demo',
    phone: '(303) 555-3004',
    address: { street: '3300 Pipe Lane', city: 'Aurora', state: 'CO', zip: '80011' },
    category: 'plumbing',
    isActive: true,
    notes: 'Commercial and residential plumbing. Will-call and delivery.',
  },
  {
    name: 'Colorado Tile & Stone',
    contactName: 'Marco Ricci',
    email: 'marco@cotilestone.demo',
    phone: '(303) 555-3005',
    address: { street: '600 Design Center Pkwy', city: 'Englewood', state: 'CO', zip: '80110' },
    category: 'finishing',
    isActive: true,
    notes: 'Tile, stone, and countertops. Showroom open for client selections.',
  },
  {
    name: 'BuildPro Hardware & Fasteners',
    contactName: 'Steve Walsh',
    email: 'steve@buildprohw.demo',
    phone: '(303) 555-3006',
    address: { street: '2100 Fastener Way', city: 'Littleton', state: 'CO', zip: '80120' },
    category: 'hardware',
    isActive: true,
    notes: 'Bulk fasteners and hardware. Free delivery on orders over $200.',
  },
];

// ============================================
// Demo Materials
// ============================================

// Supplier IDs will be populated at runtime
let supplierIds: Record<string, string> = {};

function buildMaterials(): Omit<MaterialItem, 'id'>[] {
  return [
    // Lumber
    {
      name: '2x4x8 SPF Studs',
      description: 'Kiln-dried spruce-pine-fir studs, 8ft length',
      category: 'lumber',
      unit: 'each',
      unitCost: 4.28,
      quantity: 240,
      minStockLevel: 50,
      location: 'Warehouse - Lumber Rack A',
      supplierId: supplierIds['Front Range Lumber Co.'],
      projectId: null,
      isActive: true,
    },
    {
      name: '2x6x12 Pressure Treated',
      description: 'Ground-contact rated pressure treated lumber, 12ft',
      category: 'lumber',
      unit: 'each',
      unitCost: 12.97,
      quantity: 45,
      minStockLevel: 20,
      location: 'Warehouse - Lumber Rack B',
      supplierId: supplierIds['Front Range Lumber Co.'],
      projectId: 'demo-proj-thompson-deck',
      isActive: true,
    },
    {
      name: '3/4" Plywood Sheets (4x8)',
      description: 'CDX grade plywood, sanded one side',
      category: 'lumber',
      unit: 'each',
      unitCost: 52.00,
      quantity: 18,
      minStockLevel: 10,
      location: 'Warehouse - Sheet Goods',
      supplierId: supplierIds['Front Range Lumber Co.'],
      projectId: null,
      isActive: true,
    },

    // Concrete
    {
      name: 'Quikrete 80lb Concrete Mix',
      description: 'High-strength concrete mix for general construction',
      category: 'concrete',
      unit: 'bag',
      unitCost: 6.48,
      quantity: 60,
      minStockLevel: 20,
      location: 'Warehouse - Concrete Aisle',
      supplierId: supplierIds['Rocky Mountain Concrete Supply'],
      projectId: null,
      isActive: true,
    },
    {
      name: 'Portland Cement Type I/II',
      description: '94lb bag, general purpose portland cement',
      category: 'concrete',
      unit: 'bag',
      unitCost: 14.50,
      quantity: 15,
      minStockLevel: 10,
      location: 'Warehouse - Concrete Aisle',
      supplierId: supplierIds['Rocky Mountain Concrete Supply'],
      projectId: null,
      isActive: true,
    },

    // Electrical
    {
      name: '12/2 NM-B Romex Wire (250ft)',
      description: '12 gauge, 2-conductor with ground, non-metallic sheathed cable',
      category: 'electrical',
      unit: 'box',
      unitCost: 89.00,
      quantity: 4,
      minStockLevel: 2,
      location: 'Warehouse - Electrical Shelf',
      supplierId: supplierIds['Peak Electrical Distributors'],
      projectId: 'demo-proj-garcia-basement',
      isActive: true,
    },
    {
      name: '200A Main Breaker Panel',
      description: '40-space, 200 amp main breaker load center',
      category: 'electrical',
      unit: 'each',
      unitCost: 189.00,
      quantity: 1,
      minStockLevel: 0,
      location: 'Warehouse - Electrical Shelf',
      supplierId: supplierIds['Peak Electrical Distributors'],
      projectId: 'demo-proj-garcia-basement',
      isActive: true,
    },
    {
      name: 'LED Recessed Light Kit (6-Pack)',
      description: '6" slim recessed LED lights, 5000K daylight, IC rated',
      category: 'electrical',
      unit: 'box',
      unitCost: 64.99,
      quantity: 3,
      minStockLevel: 1,
      location: 'Warehouse - Electrical Shelf',
      supplierId: supplierIds['Peak Electrical Distributors'],
      projectId: null,
      isActive: true,
    },

    // Plumbing
    {
      name: '1/2" PEX Tubing (300ft)',
      description: 'Red and blue PEX-A tubing for hot/cold supply lines',
      category: 'plumbing',
      unit: 'each',
      unitCost: 78.00,
      quantity: 2,
      minStockLevel: 1,
      location: 'Warehouse - Plumbing Section',
      supplierId: supplierIds['Mile High Plumbing Warehouse'],
      projectId: 'demo-proj-garcia-basement',
      isActive: true,
    },
    {
      name: '3" PVC DWV Pipe (10ft)',
      description: 'Schedule 40 PVC drain-waste-vent pipe',
      category: 'plumbing',
      unit: 'each',
      unitCost: 12.48,
      quantity: 8,
      minStockLevel: 4,
      location: 'Warehouse - Plumbing Section',
      supplierId: supplierIds['Mile High Plumbing Warehouse'],
      projectId: null,
      isActive: true,
    },

    // Finishing
    {
      name: 'Porcelain Floor Tile 12x24 (Gray)',
      description: 'Rectified porcelain tile, matte finish, 15.5 sqft/box',
      category: 'finishing',
      unit: 'box',
      unitCost: 42.99,
      quantity: 22,
      minStockLevel: 5,
      location: 'Warehouse - Tile Section',
      supplierId: supplierIds['Colorado Tile & Stone'],
      projectId: 'demo-proj-brown-kitchen',
      isActive: true,
    },
    {
      name: '1/2" Drywall Sheets (4x8)',
      description: 'Standard gypsum drywall sheets',
      category: 'finishing',
      unit: 'each',
      unitCost: 14.97,
      quantity: 35,
      minStockLevel: 15,
      location: 'Warehouse - Drywall Stack',
      supplierId: supplierIds['Front Range Lumber Co.'],
      projectId: null,
      isActive: true,
    },
    {
      name: 'Joint Compound (5 Gallon)',
      description: 'All-purpose drywall joint compound, ready-mix',
      category: 'finishing',
      unit: 'each',
      unitCost: 18.97,
      quantity: 6,
      minStockLevel: 3,
      location: 'Warehouse - Drywall Stack',
      supplierId: supplierIds['Front Range Lumber Co.'],
      projectId: null,
      isActive: true,
    },
    {
      name: 'Subway Tile White 3x6 (Case)',
      description: 'Glossy ceramic subway tile, 12.5 sqft per case',
      category: 'finishing',
      unit: 'box',
      unitCost: 28.50,
      quantity: 10,
      minStockLevel: 3,
      location: 'Warehouse - Tile Section',
      supplierId: supplierIds['Colorado Tile & Stone'],
      projectId: 'demo-proj-brown-kitchen',
      isActive: true,
    },

    // Hardware
    {
      name: '#8 x 2-1/2" Deck Screws (5lb Box)',
      description: 'Coated star-drive deck screws, approx 375 per box',
      category: 'hardware',
      unit: 'box',
      unitCost: 32.97,
      quantity: 8,
      minStockLevel: 3,
      location: 'Warehouse - Fastener Wall',
      supplierId: supplierIds['BuildPro Hardware & Fasteners'],
      projectId: 'demo-proj-thompson-deck',
      isActive: true,
    },
    {
      name: 'Simpson Strong-Tie Joist Hangers',
      description: 'LUS26 2x6 face-mount joist hangers, box of 25',
      category: 'hardware',
      unit: 'box',
      unitCost: 58.75,
      quantity: 3,
      minStockLevel: 1,
      location: 'Warehouse - Fastener Wall',
      supplierId: supplierIds['BuildPro Hardware & Fasteners'],
      projectId: 'demo-proj-thompson-deck',
      isActive: true,
    },
    {
      name: 'Construction Adhesive (28oz Tube)',
      description: 'Heavy-duty polyurethane construction adhesive',
      category: 'hardware',
      unit: 'each',
      unitCost: 7.98,
      quantity: 12,
      minStockLevel: 6,
      location: 'Warehouse - Adhesives Shelf',
      supplierId: supplierIds['BuildPro Hardware & Fasteners'],
      projectId: null,
      isActive: true,
    },
  ];
}

// ============================================
// Demo Purchase Orders
// ============================================

// Project references for POs
const DEMO_PROJECTS = {
  thompsonDeck: { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  garciaBasement: { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
  brownKitchen: { id: 'demo-proj-brown-kitchen', name: 'Brown Kitchen Remodel' },
  smithKitchen: { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Renovation' },
  officePark: { id: 'demo-proj-office-park', name: 'Office Park TI' },
};

function buildPurchaseOrders(): Omit<PurchaseOrder, 'id'>[] {
  return [
    // PO-001: Lumber for Thompson Deck
    {
      poNumber: 'PO-2026-001',
      supplierId: supplierIds['Front Range Lumber Co.'],
      supplierName: 'Front Range Lumber Co.',
      projectId: DEMO_PROJECTS.thompsonDeck.id,
      projectName: DEMO_PROJECTS.thompsonDeck.name,
      items: [
        { materialId: '', materialName: '2x6x12 Pressure Treated', description: 'Deck framing lumber', quantity: 30, unit: 'each', unitCost: 12.97, total: 389.10 },
        { materialId: '', materialName: '5/4x6x12 Composite Decking', description: 'Trex Enhance composite boards', quantity: 45, unit: 'each', unitCost: 38.50, total: 1732.50 },
        { materialId: '', materialName: '4x4x10 PT Posts', description: 'Pressure treated deck posts', quantity: 8, unit: 'each', unitCost: 18.97, total: 151.76 },
      ],
      subtotal: 2273.36,
      tax: 181.87,
      total: 2455.23,
      status: 'received',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(21),
      expectedDelivery: daysAgo(14),
    },

    // PO-002: Electrical for Garcia Basement
    {
      poNumber: 'PO-2026-002',
      supplierId: supplierIds['Peak Electrical Distributors'],
      supplierName: 'Peak Electrical Distributors',
      projectId: DEMO_PROJECTS.garciaBasement.id,
      projectName: DEMO_PROJECTS.garciaBasement.name,
      items: [
        { materialId: '', materialName: '12/2 NM-B Romex Wire (250ft)', description: 'General circuit wiring', quantity: 3, unit: 'box', unitCost: 89.00, total: 267.00 },
        { materialId: '', materialName: '200A Main Breaker Panel', description: 'Sub-panel for basement', quantity: 1, unit: 'each', unitCost: 189.00, total: 189.00 },
        { materialId: '', materialName: 'LED Recessed Light Kit (6-Pack)', description: 'Basement main area lighting', quantity: 2, unit: 'box', unitCost: 64.99, total: 129.98 },
        { materialId: '', materialName: '20A GFCI Outlets (10-Pack)', description: 'Basement outlets', quantity: 1, unit: 'box', unitCost: 89.97, total: 89.97 },
      ],
      subtotal: 675.95,
      tax: 54.08,
      total: 730.03,
      status: 'received',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(30),
      expectedDelivery: daysAgo(23),
    },

    // PO-003: Tile for Brown Kitchen
    {
      poNumber: 'PO-2026-003',
      supplierId: supplierIds['Colorado Tile & Stone'],
      supplierName: 'Colorado Tile & Stone',
      projectId: DEMO_PROJECTS.brownKitchen.id,
      projectName: DEMO_PROJECTS.brownKitchen.name,
      items: [
        { materialId: '', materialName: 'Porcelain Floor Tile 12x24 (Gray)', description: 'Kitchen floor tile', quantity: 15, unit: 'box', unitCost: 42.99, total: 644.85 },
        { materialId: '', materialName: 'Subway Tile White 3x6 (Case)', description: 'Backsplash tile', quantity: 8, unit: 'box', unitCost: 28.50, total: 228.00 },
        { materialId: '', materialName: 'Tile Thinset Mortar (50lb)', description: 'Modified thinset for porcelain', quantity: 4, unit: 'bag', unitCost: 22.97, total: 91.88 },
        { materialId: '', materialName: 'Tile Grout Sanded (25lb)', description: 'Pewter color grout', quantity: 2, unit: 'bag', unitCost: 17.98, total: 35.96 },
      ],
      subtotal: 1000.69,
      tax: 80.06,
      total: 1080.75,
      status: 'approved',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(7),
      expectedDelivery: daysFromNow(3),
    },

    // PO-004: Plumbing for Garcia Basement
    {
      poNumber: 'PO-2026-004',
      supplierId: supplierIds['Mile High Plumbing Warehouse'],
      supplierName: 'Mile High Plumbing Warehouse',
      projectId: DEMO_PROJECTS.garciaBasement.id,
      projectName: DEMO_PROJECTS.garciaBasement.name,
      items: [
        { materialId: '', materialName: '1/2" PEX Tubing (300ft)', description: 'Hot and cold supply lines', quantity: 2, unit: 'each', unitCost: 78.00, total: 156.00 },
        { materialId: '', materialName: '3" PVC DWV Pipe (10ft)', description: 'Bathroom drain', quantity: 4, unit: 'each', unitCost: 12.48, total: 49.92 },
        { materialId: '', materialName: 'PEX Fittings Assortment Kit', description: 'Elbows, tees, couplings', quantity: 1, unit: 'each', unitCost: 64.99, total: 64.99 },
        { materialId: '', materialName: 'Bathroom Rough-In Kit', description: 'Toilet flange, shower drain, p-traps', quantity: 1, unit: 'each', unitCost: 87.50, total: 87.50 },
      ],
      subtotal: 358.41,
      tax: 28.67,
      total: 387.08,
      status: 'received',
      orderedBy: DEMO_USERS.foreman.displayName,
      orderedAt: daysAgo(25),
      expectedDelivery: daysAgo(18),
    },

    // PO-005: Hardware for Thompson Deck
    {
      poNumber: 'PO-2026-005',
      supplierId: supplierIds['BuildPro Hardware & Fasteners'],
      supplierName: 'BuildPro Hardware & Fasteners',
      projectId: DEMO_PROJECTS.thompsonDeck.id,
      projectName: DEMO_PROJECTS.thompsonDeck.name,
      items: [
        { materialId: '', materialName: '#8 x 2-1/2" Deck Screws (5lb Box)', description: 'Composite decking fasteners', quantity: 5, unit: 'box', unitCost: 32.97, total: 164.85 },
        { materialId: '', materialName: 'Simpson Strong-Tie Joist Hangers', description: 'LUS26 joist hangers', quantity: 2, unit: 'box', unitCost: 58.75, total: 117.50 },
        { materialId: '', materialName: 'Lag Bolts 3/8" x 6" (25-Pack)', description: 'Ledger board attachment', quantity: 2, unit: 'box', unitCost: 28.99, total: 57.98 },
        { materialId: '', materialName: 'Post Base Hardware', description: 'Adjustable post bases, 6 pack', quantity: 2, unit: 'each', unitCost: 42.50, total: 85.00 },
      ],
      subtotal: 425.33,
      tax: 34.03,
      total: 459.36,
      status: 'received',
      orderedBy: DEMO_USERS.foreman.displayName,
      orderedAt: daysAgo(18),
      expectedDelivery: daysAgo(12),
    },

    // PO-006: Drywall for Garcia Basement (submitted, awaiting approval)
    {
      poNumber: 'PO-2026-006',
      supplierId: supplierIds['Front Range Lumber Co.'],
      supplierName: 'Front Range Lumber Co.',
      projectId: DEMO_PROJECTS.garciaBasement.id,
      projectName: DEMO_PROJECTS.garciaBasement.name,
      items: [
        { materialId: '', materialName: '1/2" Drywall Sheets (4x8)', description: 'Basement walls and ceiling', quantity: 60, unit: 'each', unitCost: 14.97, total: 898.20 },
        { materialId: '', materialName: 'Joint Compound (5 Gallon)', description: 'Finishing compound', quantity: 4, unit: 'each', unitCost: 18.97, total: 75.88 },
        { materialId: '', materialName: 'Drywall Tape (500ft Roll)', description: 'Paper joint tape', quantity: 6, unit: 'each', unitCost: 5.98, total: 35.88 },
        { materialId: '', materialName: 'Drywall Screws #6 x 1-5/8" (5lb)', description: 'Coarse thread drywall screws', quantity: 3, unit: 'box', unitCost: 12.97, total: 38.91 },
      ],
      subtotal: 1048.87,
      tax: 83.91,
      total: 1132.78,
      status: 'submitted',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(3),
      expectedDelivery: daysFromNow(7),
    },

    // PO-007: Office Park TI - general materials (draft)
    {
      poNumber: 'PO-2026-007',
      supplierId: supplierIds['Front Range Lumber Co.'],
      supplierName: 'Front Range Lumber Co.',
      projectId: DEMO_PROJECTS.officePark.id,
      projectName: DEMO_PROJECTS.officePark.name,
      items: [
        { materialId: '', materialName: '2x4x8 SPF Studs', description: 'Interior partition framing', quantity: 120, unit: 'each', unitCost: 4.28, total: 513.60 },
        { materialId: '', materialName: '3/4" Plywood Sheets (4x8)', description: 'Subfloor patching', quantity: 8, unit: 'each', unitCost: 52.00, total: 416.00 },
        { materialId: '', materialName: '1/2" Drywall Sheets (4x8)', description: 'New partition walls', quantity: 80, unit: 'each', unitCost: 14.97, total: 1197.60 },
      ],
      subtotal: 2127.20,
      tax: 170.18,
      total: 2297.38,
      status: 'draft',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(1),
      expectedDelivery: daysFromNow(14),
    },

    // PO-008: Concrete for Thompson Deck (footings)
    {
      poNumber: 'PO-2026-008',
      supplierId: supplierIds['Rocky Mountain Concrete Supply'],
      supplierName: 'Rocky Mountain Concrete Supply',
      projectId: DEMO_PROJECTS.thompsonDeck.id,
      projectName: DEMO_PROJECTS.thompsonDeck.name,
      items: [
        { materialId: '', materialName: 'Quikrete 80lb Concrete Mix', description: 'Deck post footings', quantity: 16, unit: 'bag', unitCost: 6.48, total: 103.68 },
        { materialId: '', materialName: 'Sonotube 12" (4ft)', description: 'Footing forms', quantity: 8, unit: 'each', unitCost: 14.97, total: 119.76 },
        { materialId: '', materialName: '#4 Rebar (20ft)', description: 'Footing reinforcement', quantity: 6, unit: 'each', unitCost: 11.98, total: 71.88 },
      ],
      subtotal: 295.32,
      tax: 23.63,
      total: 318.95,
      status: 'received',
      orderedBy: DEMO_USERS.foreman.displayName,
      orderedAt: daysAgo(28),
      expectedDelivery: daysAgo(25),
    },

    // PO-009: Finishing materials for Smith Kitchen (cancelled)
    {
      poNumber: 'PO-2026-009',
      supplierId: supplierIds['Colorado Tile & Stone'],
      supplierName: 'Colorado Tile & Stone',
      projectId: DEMO_PROJECTS.smithKitchen.id,
      projectName: DEMO_PROJECTS.smithKitchen.name,
      items: [
        { materialId: '', materialName: 'Quartz Countertop Slab', description: 'Calacatta Gold quartz - client changed selection', quantity: 1, unit: 'each', unitCost: 2400.00, total: 2400.00 },
      ],
      subtotal: 2400.00,
      tax: 192.00,
      total: 2592.00,
      status: 'cancelled',
      orderedBy: DEMO_USERS.pm.displayName,
      orderedAt: daysAgo(45),
      expectedDelivery: daysAgo(30),
    },

    // PO-010: Adhesives and sealants (approved, in transit)
    {
      poNumber: 'PO-2026-010',
      supplierId: supplierIds['BuildPro Hardware & Fasteners'],
      supplierName: 'BuildPro Hardware & Fasteners',
      projectId: DEMO_PROJECTS.brownKitchen.id,
      projectName: DEMO_PROJECTS.brownKitchen.name,
      items: [
        { materialId: '', materialName: 'Construction Adhesive (28oz Tube)', description: 'Subfloor and backerboard', quantity: 8, unit: 'each', unitCost: 7.98, total: 63.84 },
        { materialId: '', materialName: 'Silicone Caulk White (10oz)', description: 'Kitchen and bath sealant', quantity: 6, unit: 'each', unitCost: 6.48, total: 38.88 },
        { materialId: '', materialName: 'Cement Backerboard 1/4" (3x5)', description: 'Tile underlayment', quantity: 10, unit: 'each', unitCost: 11.98, total: 119.80 },
      ],
      subtotal: 222.52,
      tax: 17.80,
      total: 240.32,
      status: 'approved',
      orderedBy: DEMO_USERS.foreman.displayName,
      orderedAt: daysAgo(5),
      expectedDelivery: daysFromNow(2),
    },
  ];
}

// ============================================
// Main Seed Function
// ============================================

async function seedMaterials() {
  const db = getDb();

  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const suppliersRef = orgRef.collection('suppliers');
  const materialsRef = orgRef.collection('materials');
  const purchaseOrdersRef = orgRef.collection('purchaseOrders');

  const now = new Date();

  // ---- Seed Suppliers ----
  logSection('Seeding Suppliers');

  const supplierBatch = db.batch();

  for (const supplier of SUPPLIERS) {
    const id = generateId('sup');
    supplierIds[supplier.name] = id;

    const supplierData = {
      id,
      orgId: DEMO_ORG_ID,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      isActive: supplier.isActive,
      notes: supplier.notes,
      isDemoData: true,
      createdAt: toTimestamp(monthsAgo(randomInt(6, 24))),
      updatedAt: toTimestamp(now),
    };

    supplierBatch.set(suppliersRef.doc(id), supplierData);
  }

  await supplierBatch.commit();
  logSuccess(`Created ${SUPPLIERS.length} suppliers`);

  // ---- Seed Materials ----
  logSection('Seeding Materials');

  const materials = buildMaterials();
  const materialBatch = db.batch();
  const materialIds: Record<string, string> = {};

  for (const material of materials) {
    const id = generateId('mat');
    materialIds[material.name] = id;

    const materialData = {
      id,
      orgId: DEMO_ORG_ID,
      name: material.name,
      description: material.description,
      category: material.category,
      unit: material.unit,
      unitCost: material.unitCost,
      quantity: material.quantity,
      quantityOnHand: material.quantity,
      quantityReserved: 0,
      quantityAvailable: material.quantity,
      minStockLevel: material.minStockLevel,
      reorderPoint: material.minStockLevel,
      status: material.quantity <= material.minStockLevel ? 'low_stock' : 'in_stock',
      location: material.location,
      defaultLocation: material.location,
      supplierId: material.supplierId || null,
      preferredSupplierId: material.supplierId || null,
      projectId: material.projectId,
      isActive: material.isActive,
      isDemoData: true,
      createdAt: toTimestamp(monthsAgo(randomInt(1, 6))),
      createdBy: DEMO_USERS.admin.uid,
      updatedAt: toTimestamp(now),
    };

    materialBatch.set(materialsRef.doc(id), materialData);
  }

  await materialBatch.commit();
  logSuccess(`Created ${materials.length} materials`);

  // ---- Seed Purchase Orders ----
  logSection('Seeding Purchase Orders');

  const purchaseOrders = buildPurchaseOrders();
  const poBatch = db.batch();

  for (const po of purchaseOrders) {
    const id = generateId('po');

    // Link material IDs into line items where we have a match
    const linkedItems = po.items.map((item) => ({
      ...item,
      materialId: materialIds[item.materialName] || '',
    }));

    const poData = {
      id,
      orgId: DEMO_ORG_ID,
      poNumber: po.poNumber,
      supplierId: po.supplierId || null,
      supplierName: po.supplierName,
      projectId: po.projectId,
      projectName: po.projectName,
      items: linkedItems,
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      status: po.status,
      orderedBy: po.orderedBy,
      orderedAt: toTimestamp(po.orderedAt),
      expectedDelivery: toTimestamp(po.expectedDelivery),
      receivedAt: po.status === 'received' ? toTimestamp(po.expectedDelivery) : null,
      cancelledAt: po.status === 'cancelled' ? toTimestamp(daysAgo(40)) : null,
      notes: po.status === 'cancelled' ? 'Client changed countertop selection — reordering different material.' : '',
      isDemoData: true,
      createdAt: toTimestamp(po.orderedAt),
      updatedAt: toTimestamp(now),
    };

    poBatch.set(purchaseOrdersRef.doc(id), poData);
  }

  await poBatch.commit();
  logSuccess(`Created ${purchaseOrders.length} purchase orders`);

  // ---- Summary ----
  logSection('Materials Seeding Complete');
  console.log(`  - ${SUPPLIERS.length} suppliers`);
  console.log(`  - ${materials.length} materials`);
  console.log(`  - ${purchaseOrders.length} purchase orders`);
}

// Run if called directly
seedMaterials()
  .then(() => {
    console.log('\nMaterials, suppliers, and purchase orders seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError seeding materials:', error);
    process.exit(1);
  });
