/**
 * Vendor data for expense seeding
 * Used by seed-expenses.ts
 */

export const VENDORS = {
  materials: [
    'Home Depot',
    'Lowes',
    'ABC Supply',
    'Ferguson Plumbing',
    '84 Lumber',
    'Floor & Decor',
    'ProSource Wholesale',
    'Builders FirstSource',
  ],
  subs: [
    'Tony Plumbing LLC',
    'Elite HVAC Services',
    'Rodriguez Tile & Flooring',
    'Mountain Electric Co',
    'Piedmont Drywall',
    'Carolina Roofing',
  ],
  equipment: [
    'United Rentals',
    'Sunbelt Rentals',
    'Herc Rentals',
    'Home Depot Rentals',
  ],
  fuel: [
    'Shell',
    'BP',
    'Exxon',
    'Sheetz',
  ],
  permits: [
    'City of Winston-Salem',
    'Forsyth County Permits',
    'City of Greensboro',
    'Guilford County',
  ],
  office: [
    'Office Depot',
    'Staples',
    'Amazon Business',
  ],
  tools: [
    'Harbor Freight',
    'Home Depot',
    'Milwaukee Tool',
    'DeWalt Direct',
    'Grainger',
  ],
};

export const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  materials: [
    'Lumber and framing materials',
    'Drywall sheets and supplies',
    'Plumbing fixtures and fittings',
    'Electrical supplies and wire',
    'Paint and finishing supplies',
    'Tile and adhesive',
    'Cabinet hardware',
    'Flooring materials',
    'Insulation materials',
    'Concrete and masonry supplies',
    'Roofing materials',
    'Window trim and molding',
    'Door hardware',
    'HVAC supplies',
  ],
  tools: [
    'Cordless drill set',
    'Circular saw blade replacement',
    'Level and measuring tools',
    'Safety equipment',
    'Hand tools assortment',
    'Drill bits and accessories',
    'Sanding supplies',
    'Caulk gun and supplies',
  ],
  equipment_rental: [
    'Scissor lift rental (daily)',
    'Dumpster rental (weekly)',
    'Scaffolding rental',
    'Concrete mixer rental',
    'Power washer rental',
    'Floor sander rental',
    'Tile saw rental',
    'Compressor rental',
  ],
  fuel: [
    'Fuel for work truck',
    'Fuel for company vehicle',
    'Job site travel fuel',
    'Equipment fuel',
  ],
  permits: [
    'Building permit fee',
    'Electrical permit',
    'Plumbing permit',
    'Mechanical permit',
    'Inspection fee',
  ],
  subcontractor: [
    'Plumbing rough-in',
    'Electrical installation',
    'HVAC installation',
    'Tile installation',
    'Drywall finishing',
    'Roofing work',
    'Concrete work',
    'Painting services',
  ],
  office: [
    'Printer paper and ink',
    'Project documentation',
    'Safety signage',
    'Office supplies',
  ],
};

export const PAYMENT_METHODS: ('cash' | 'credit_card' | 'debit_card' | 'check' | 'company_card')[] = [
  'company_card',
  'company_card',
  'company_card',
  'check',
  'check',
  'debit_card',
  'credit_card',
  'cash',
];
