/**
 * Material Predictor Utility
 * Analyzes project scope and predicts material needs
 */

export interface ProjectScope {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'renovation';
  squareFootage?: number;
  phases: ScopePhase[];
  location?: string;
}

export interface ScopePhase {
  id: string;
  name: string;
  category: PhaseCategory;
  items: ScopeLineItem[];
  status: 'pending' | 'in-progress' | 'completed';
}

export type PhaseCategory =
  | 'demolition'
  | 'foundation'
  | 'framing'
  | 'roofing'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'insulation'
  | 'drywall'
  | 'flooring'
  | 'painting'
  | 'cabinetry'
  | 'fixtures'
  | 'landscaping'
  | 'other';

export interface ScopeLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface MaterialPrediction {
  materialId: string;
  materialName: string;
  category: string;
  predictedQuantity: number;
  unit: string;
  confidence: 'low' | 'medium' | 'high';
  basedOn: string;
  estimatedCost?: {
    low: number;
    high: number;
    average: number;
  };
  leadTime?: {
    days: number;
    supplier?: string;
  };
  shortageRisk: 'none' | 'low' | 'medium' | 'high';
  alternatives?: string[];
}

export interface MaterialAnalysis {
  predictions: MaterialPrediction[];
  shortageAlerts: ShortageAlert[];
  totalEstimatedCost: {
    low: number;
    high: number;
  };
  recommendations: string[];
}

export interface ShortageAlert {
  materialName: string;
  reason: string;
  severity: 'warning' | 'critical';
  recommendation: string;
}

// Material estimation factors by phase category
const MATERIAL_FACTORS: Record<PhaseCategory, MaterialFactor[]> = {
  foundation: [
    { material: 'Concrete', baseUnit: 'cu yd', factorPerSqFt: 0.05, confidence: 'high' },
    { material: 'Rebar', baseUnit: 'tons', factorPerSqFt: 0.002, confidence: 'high' },
    { material: 'Gravel', baseUnit: 'cu yd', factorPerSqFt: 0.02, confidence: 'medium' },
    { material: 'Vapor Barrier', baseUnit: 'sq ft', factorPerSqFt: 1.1, confidence: 'high' },
  ],
  framing: [
    { material: '2x4 Lumber', baseUnit: 'board ft', factorPerSqFt: 3, confidence: 'medium' },
    { material: '2x6 Lumber', baseUnit: 'board ft', factorPerSqFt: 2, confidence: 'medium' },
    { material: 'Plywood Sheathing', baseUnit: 'sheets', factorPerSqFt: 0.04, confidence: 'high' },
    { material: 'Nails/Fasteners', baseUnit: 'lbs', factorPerSqFt: 0.5, confidence: 'medium' },
    { material: 'Metal Connectors', baseUnit: 'pieces', factorPerSqFt: 0.2, confidence: 'low' },
  ],
  roofing: [
    { material: 'Shingles', baseUnit: 'bundles', factorPerSqFt: 0.035, confidence: 'high' },
    { material: 'Underlayment', baseUnit: 'rolls', factorPerSqFt: 0.01, confidence: 'high' },
    { material: 'Flashing', baseUnit: 'linear ft', factorPerSqFt: 0.1, confidence: 'medium' },
    { material: 'Ridge Vents', baseUnit: 'linear ft', factorPerSqFt: 0.02, confidence: 'medium' },
  ],
  electrical: [
    { material: 'Romex Wire (14/2)', baseUnit: 'ft', factorPerSqFt: 2, confidence: 'medium' },
    { material: 'Romex Wire (12/2)', baseUnit: 'ft', factorPerSqFt: 1, confidence: 'medium' },
    { material: 'Outlets', baseUnit: 'pieces', factorPerSqFt: 0.05, confidence: 'medium' },
    { material: 'Switches', baseUnit: 'pieces', factorPerSqFt: 0.02, confidence: 'medium' },
    { material: 'Breakers', baseUnit: 'pieces', factorPerSqFt: 0.01, confidence: 'low' },
  ],
  plumbing: [
    { material: 'PEX Pipe', baseUnit: 'ft', factorPerSqFt: 1.5, confidence: 'medium' },
    { material: 'PVC Drain Pipe', baseUnit: 'ft', factorPerSqFt: 0.5, confidence: 'medium' },
    { material: 'Fittings', baseUnit: 'pieces', factorPerSqFt: 0.3, confidence: 'low' },
    { material: 'Shut-off Valves', baseUnit: 'pieces', factorPerSqFt: 0.02, confidence: 'medium' },
  ],
  hvac: [
    { material: 'Ductwork', baseUnit: 'linear ft', factorPerSqFt: 0.3, confidence: 'low' },
    { material: 'Vents/Registers', baseUnit: 'pieces', factorPerSqFt: 0.01, confidence: 'medium' },
    { material: 'Insulated Flex Duct', baseUnit: 'ft', factorPerSqFt: 0.2, confidence: 'medium' },
  ],
  insulation: [
    { material: 'Batt Insulation', baseUnit: 'sq ft', factorPerSqFt: 1.5, confidence: 'high' },
    { material: 'Spray Foam', baseUnit: 'board ft', factorPerSqFt: 1, confidence: 'medium' },
  ],
  drywall: [
    { material: 'Drywall Sheets', baseUnit: 'sheets', factorPerSqFt: 0.04, confidence: 'high' },
    { material: 'Joint Compound', baseUnit: 'gallons', factorPerSqFt: 0.015, confidence: 'high' },
    { material: 'Drywall Tape', baseUnit: 'ft', factorPerSqFt: 0.3, confidence: 'high' },
    { material: 'Drywall Screws', baseUnit: 'lbs', factorPerSqFt: 0.02, confidence: 'medium' },
  ],
  flooring: [
    { material: 'Underlayment', baseUnit: 'sq ft', factorPerSqFt: 1.1, confidence: 'high' },
    { material: 'Flooring Material', baseUnit: 'sq ft', factorPerSqFt: 1.1, confidence: 'high' },
    { material: 'Transition Strips', baseUnit: 'pieces', factorPerSqFt: 0.005, confidence: 'medium' },
  ],
  painting: [
    { material: 'Primer', baseUnit: 'gallons', factorPerSqFt: 0.003, confidence: 'high' },
    { material: 'Paint', baseUnit: 'gallons', factorPerSqFt: 0.008, confidence: 'high' },
    { material: 'Caulk', baseUnit: 'tubes', factorPerSqFt: 0.005, confidence: 'medium' },
  ],
  demolition: [
    { material: 'Dumpster Rental', baseUnit: 'days', factorPerSqFt: 0.001, confidence: 'low' },
    { material: 'Protective Plastic', baseUnit: 'rolls', factorPerSqFt: 0.005, confidence: 'medium' },
  ],
  cabinetry: [],
  fixtures: [],
  landscaping: [
    { material: 'Topsoil', baseUnit: 'cu yd', factorPerSqFt: 0.01, confidence: 'low' },
    { material: 'Mulch', baseUnit: 'cu yd', factorPerSqFt: 0.005, confidence: 'low' },
    { material: 'Sod', baseUnit: 'sq ft', factorPerSqFt: 0.5, confidence: 'medium' },
  ],
  other: [],
};

interface MaterialFactor {
  material: string;
  baseUnit: string;
  factorPerSqFt: number;
  confidence: 'low' | 'medium' | 'high';
}

// Estimated costs per unit (rough averages)
const MATERIAL_COSTS: Record<string, { low: number; high: number }> = {
  'Concrete': { low: 100, high: 150 },
  'Rebar': { low: 800, high: 1200 },
  '2x4 Lumber': { low: 0.5, high: 1.5 },
  '2x6 Lumber': { low: 0.75, high: 2 },
  'Plywood Sheathing': { low: 30, high: 60 },
  'Shingles': { low: 30, high: 50 },
  'Romex Wire (14/2)': { low: 0.3, high: 0.6 },
  'PEX Pipe': { low: 0.5, high: 1.5 },
  'Drywall Sheets': { low: 12, high: 20 },
  'Paint': { low: 25, high: 60 },
};

// Lead times in days
const MATERIAL_LEAD_TIMES: Record<string, number> = {
  'Concrete': 3,
  '2x4 Lumber': 1,
  '2x6 Lumber': 1,
  'Plywood Sheathing': 2,
  'Shingles': 5,
  'Drywall Sheets': 2,
  'Paint': 1,
  'Appliances': 14,
  'Custom Cabinets': 28,
  'Windows': 21,
  'Doors': 14,
};

// Materials with known supply chain issues
const SHORTAGE_RISK_MATERIALS = new Set([
  'Appliances',
  'Custom Cabinets',
  'Windows',
  'HVAC Equipment',
  'Electrical Panels',
]);

/**
 * Calculate material predictions for a specific phase
 */
function predictForPhase(
  phase: ScopePhase,
  squareFootage: number
): MaterialPrediction[] {
  const factors = MATERIAL_FACTORS[phase.category] || [];
  const predictions: MaterialPrediction[] = [];

  factors.forEach(factor => {
    const predictedQuantity = Math.ceil(squareFootage * factor.factorPerSqFt);
    const costs = MATERIAL_COSTS[factor.material];
    const leadTimeDays = MATERIAL_LEAD_TIMES[factor.material];

    predictions.push({
      materialId: `${phase.id}-${factor.material.toLowerCase().replace(/\s+/g, '-')}`,
      materialName: factor.material,
      category: phase.category,
      predictedQuantity,
      unit: factor.baseUnit,
      confidence: factor.confidence,
      basedOn: `${squareFootage} sq ft @ ${factor.factorPerSqFt} ${factor.baseUnit}/sq ft`,
      estimatedCost: costs ? {
        low: predictedQuantity * costs.low,
        high: predictedQuantity * costs.high,
        average: predictedQuantity * ((costs.low + costs.high) / 2),
      } : undefined,
      leadTime: leadTimeDays ? { days: leadTimeDays } : undefined,
      shortageRisk: SHORTAGE_RISK_MATERIALS.has(factor.material) ? 'medium' : 'none',
    });
  });

  // Add materials based on specific line items
  phase.items.forEach(item => {
    const description = item.description.toLowerCase();

    // Detect specific materials mentioned in line items
    if (description.includes('window') && !predictions.some(p => p.materialName === 'Windows')) {
      predictions.push({
        materialId: `${phase.id}-windows`,
        materialName: 'Windows',
        category: phase.category,
        predictedQuantity: item.quantity,
        unit: item.unit || 'units',
        confidence: 'high',
        basedOn: `Line item: ${item.description}`,
        leadTime: { days: 21 },
        shortageRisk: 'medium',
      });
    }

    if (description.includes('door') && !predictions.some(p => p.materialName === 'Doors')) {
      predictions.push({
        materialId: `${phase.id}-doors`,
        materialName: 'Doors',
        category: phase.category,
        predictedQuantity: item.quantity,
        unit: item.unit || 'units',
        confidence: 'high',
        basedOn: `Line item: ${item.description}`,
        leadTime: { days: 14 },
        shortageRisk: 'low',
      });
    }
  });

  return predictions;
}

/**
 * Generate shortage alerts based on predictions
 */
function generateShortageAlerts(predictions: MaterialPrediction[]): ShortageAlert[] {
  const alerts: ShortageAlert[] = [];

  predictions
    .filter(p => p.shortageRisk !== 'none')
    .forEach(prediction => {
      const severity = prediction.shortageRisk === 'high' ? 'critical' : 'warning';
      alerts.push({
        materialName: prediction.materialName,
        reason: `${prediction.materialName} has known supply chain constraints`,
        severity,
        recommendation: prediction.leadTime
          ? `Order at least ${prediction.leadTime.days + 7} days in advance`
          : 'Order early to avoid delays',
      });
    });

  // Add alerts for long lead times
  predictions
    .filter(p => p.leadTime && p.leadTime.days >= 14)
    .forEach(prediction => {
      if (!alerts.some(a => a.materialName === prediction.materialName)) {
        alerts.push({
          materialName: prediction.materialName,
          reason: `Long lead time: ${prediction.leadTime!.days} days`,
          severity: 'warning',
          recommendation: `Schedule order ${prediction.leadTime!.days + 7} days before phase starts`,
        });
      }
    });

  return alerts;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  predictions: MaterialPrediction[],
  alerts: ShortageAlert[]
): string[] {
  const recommendations: string[] = [];

  // Long lead time items
  const longLeadItems = predictions.filter(p => p.leadTime && p.leadTime.days >= 14);
  if (longLeadItems.length > 0) {
    recommendations.push(
      `Order long-lead items early: ${longLeadItems.map(p => p.materialName).join(', ')}`
    );
  }

  // Low confidence predictions
  const lowConfidence = predictions.filter(p => p.confidence === 'low');
  if (lowConfidence.length > 0) {
    recommendations.push(
      'Request detailed takeoffs for: ' + lowConfidence.map(p => p.materialName).join(', ')
    );
  }

  // Shortage risks
  if (alerts.length > 0) {
    recommendations.push(
      'Consider securing suppliers for shortage-risk materials before project start'
    );
  }

  // Bulk ordering opportunity
  const lumberItems = predictions.filter(p =>
    p.materialName.toLowerCase().includes('lumber') ||
    p.materialName.toLowerCase().includes('plywood')
  );
  if (lumberItems.length > 1) {
    recommendations.push('Consider bulk lumber order to reduce per-unit cost');
  }

  return recommendations;
}

/**
 * Main function: Predict materials for a project phase
 */
export function predictMaterials(
  projectScope: ProjectScope,
  phaseId?: string
): MaterialPrediction[] {
  const sqFt = projectScope.squareFootage || 2000; // Default assumption
  const phases = phaseId
    ? projectScope.phases.filter(p => p.id === phaseId)
    : projectScope.phases.filter(p => p.status !== 'completed');

  const predictions: MaterialPrediction[] = [];

  phases.forEach(phase => {
    predictions.push(...predictForPhase(phase, sqFt));
  });

  return predictions;
}

/**
 * Extended function: Full material analysis
 */
export function analyzeMaterials(
  projectScope: ProjectScope,
  phaseId?: string
): MaterialAnalysis {
  const predictions = predictMaterials(projectScope, phaseId);
  const shortageAlerts = generateShortageAlerts(predictions);
  const recommendations = generateRecommendations(predictions, shortageAlerts);

  // Calculate total costs
  const totalEstimatedCost = predictions.reduce(
    (acc, p) => {
      if (p.estimatedCost) {
        acc.low += p.estimatedCost.low;
        acc.high += p.estimatedCost.high;
      }
      return acc;
    },
    { low: 0, high: 0 }
  );

  return {
    predictions,
    shortageAlerts,
    totalEstimatedCost: {
      low: Math.round(totalEstimatedCost.low),
      high: Math.round(totalEstimatedCost.high),
    },
    recommendations,
  };
}
