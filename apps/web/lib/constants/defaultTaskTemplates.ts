import { TaskTemplate, TaskPriority, TaskChecklistItem } from '@/types';

export interface DefaultTaskTemplate {
  name: string;
  description?: string;
  trade?: string;
  category?: string;
  defaultTitle: string;
  defaultDescription?: string;
  defaultPriority: TaskPriority;
  defaultEstimatedHours?: number;
  defaultChecklist?: Omit<TaskChecklistItem, 'id' | 'isCompleted' | 'completedAt' | 'completedBy' | 'order'>[];
}

export const DEFAULT_TASK_TEMPLATES: DefaultTaskTemplate[] = [
  // General
  {
    name: 'Site Inspection',
    trade: 'General',
    category: 'Inspections',
    defaultTitle: 'Site Inspection',
    defaultDescription: 'Conduct thorough site inspection and document findings',
    defaultPriority: 'medium',
    defaultEstimatedHours: 2,
    defaultChecklist: [
      { title: 'Review project plans and specs' },
      { title: 'Walk site perimeter' },
      { title: 'Check for safety hazards' },
      { title: 'Document any issues with photos' },
      { title: 'Complete inspection report' },
    ],
  },
  {
    name: 'Material Delivery',
    trade: 'General',
    category: 'Logistics',
    defaultTitle: 'Material Delivery',
    defaultDescription: 'Coordinate and verify material delivery',
    defaultPriority: 'medium',
    defaultEstimatedHours: 1,
    defaultChecklist: [
      { title: 'Confirm delivery date and time' },
      { title: 'Verify delivery access' },
      { title: 'Count and inspect materials' },
      { title: 'Sign delivery receipt' },
      { title: 'Store materials properly' },
    ],
  },
  {
    name: 'Daily Cleanup',
    trade: 'General',
    category: 'Maintenance',
    defaultTitle: 'Daily Site Cleanup',
    defaultDescription: 'End of day cleanup and organization',
    defaultPriority: 'low',
    defaultEstimatedHours: 0.5,
    defaultChecklist: [
      { title: 'Collect and dispose of debris' },
      { title: 'Secure tools and equipment' },
      { title: 'Lock up site' },
    ],
  },

  // Demolition
  {
    name: 'Interior Demo',
    trade: 'Demolition',
    category: 'Demolition',
    defaultTitle: 'Interior Demolition',
    defaultDescription: 'Remove interior finishes and non-structural elements',
    defaultPriority: 'high',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      { title: 'Turn off utilities' },
      { title: 'Remove fixtures and appliances' },
      { title: 'Remove drywall/plaster' },
      { title: 'Remove flooring' },
      { title: 'Remove trim and doors' },
      { title: 'Haul debris' },
    ],
  },
  {
    name: 'Dumpster Management',
    trade: 'Demolition',
    category: 'Logistics',
    defaultTitle: 'Dumpster Pickup/Delivery',
    defaultDescription: 'Coordinate dumpster exchange',
    defaultPriority: 'medium',
    defaultEstimatedHours: 0.5,
    defaultChecklist: [
      { title: 'Schedule pickup/delivery' },
      { title: 'Clear access path' },
      { title: 'Verify dumpster placement' },
    ],
  },

  // Framing
  {
    name: 'Wall Framing',
    trade: 'Framing',
    category: 'Framing',
    defaultTitle: 'Frame Walls',
    defaultDescription: 'Frame interior/exterior walls per plans',
    defaultPriority: 'high',
    defaultEstimatedHours: 16,
    defaultChecklist: [
      { title: 'Review framing plans' },
      { title: 'Lay out wall locations' },
      { title: 'Cut and assemble wall frames' },
      { title: 'Stand and brace walls' },
      { title: 'Install headers and cripples' },
      { title: 'Check for plumb and square' },
    ],
  },
  {
    name: 'Rough Opening',
    trade: 'Framing',
    category: 'Framing',
    defaultTitle: 'Frame Rough Openings',
    defaultDescription: 'Frame openings for doors and windows',
    defaultPriority: 'medium',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      { title: 'Verify opening sizes' },
      { title: 'Install king studs' },
      { title: 'Install jack studs' },
      { title: 'Install header' },
      { title: 'Install sill (windows)' },
      { title: 'Check for level and square' },
    ],
  },

  // Electrical
  {
    name: 'Electrical Rough-In',
    trade: 'Electrical',
    category: 'Rough-In',
    defaultTitle: 'Electrical Rough-In',
    defaultDescription: 'Install electrical wiring and boxes',
    defaultPriority: 'high',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      { title: 'Review electrical plans' },
      { title: 'Mark outlet/switch locations' },
      { title: 'Install electrical boxes' },
      { title: 'Run wire to panel' },
      { title: 'Install recessed light housings' },
      { title: 'Label circuits' },
      { title: 'Prepare for inspection' },
    ],
  },
  {
    name: 'Panel Installation',
    trade: 'Electrical',
    category: 'Installation',
    defaultTitle: 'Install Electrical Panel',
    defaultDescription: 'Install and wire electrical panel',
    defaultPriority: 'high',
    defaultEstimatedHours: 6,
    defaultChecklist: [
      { title: 'Mount panel box' },
      { title: 'Install main breaker' },
      { title: 'Run service entrance cable' },
      { title: 'Wire circuits to breakers' },
      { title: 'Label panel schedule' },
      { title: 'Test circuits' },
    ],
  },
  {
    name: 'Trim Out',
    trade: 'Electrical',
    category: 'Finish',
    defaultTitle: 'Electrical Trim Out',
    defaultDescription: 'Install outlets, switches, and fixtures',
    defaultPriority: 'medium',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      { title: 'Install outlets and covers' },
      { title: 'Install switches and covers' },
      { title: 'Install light fixtures' },
      { title: 'Install ceiling fans' },
      { title: 'Test all circuits' },
      { title: 'Touch up paint around covers' },
    ],
  },

  // Plumbing
  {
    name: 'Plumbing Rough-In',
    trade: 'Plumbing',
    category: 'Rough-In',
    defaultTitle: 'Plumbing Rough-In',
    defaultDescription: 'Install drain, waste, vent and supply lines',
    defaultPriority: 'high',
    defaultEstimatedHours: 16,
    defaultChecklist: [
      { title: 'Review plumbing plans' },
      { title: 'Install DWV piping' },
      { title: 'Install water supply lines' },
      { title: 'Install shut-off valves' },
      { title: 'Pressure test lines' },
      { title: 'Prepare for inspection' },
    ],
  },
  {
    name: 'Fixture Installation',
    trade: 'Plumbing',
    category: 'Finish',
    defaultTitle: 'Install Plumbing Fixtures',
    defaultDescription: 'Install toilets, sinks, faucets, etc.',
    defaultPriority: 'medium',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      { title: 'Install toilets' },
      { title: 'Install sinks and faucets' },
      { title: 'Install shower heads' },
      { title: 'Install garbage disposal' },
      { title: 'Install dishwasher connection' },
      { title: 'Check for leaks' },
      { title: 'Test all fixtures' },
    ],
  },

  // HVAC
  {
    name: 'HVAC Rough-In',
    trade: 'HVAC',
    category: 'Rough-In',
    defaultTitle: 'HVAC Rough-In',
    defaultDescription: 'Install ductwork and rough-in equipment',
    defaultPriority: 'high',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      { title: 'Review HVAC plans' },
      { title: 'Install main trunk lines' },
      { title: 'Install branch ducts' },
      { title: 'Install supply boots' },
      { title: 'Install return air drops' },
      { title: 'Seal all connections' },
      { title: 'Prepare for inspection' },
    ],
  },
  {
    name: 'Equipment Installation',
    trade: 'HVAC',
    category: 'Installation',
    defaultTitle: 'Install HVAC Equipment',
    defaultDescription: 'Install furnace, AC unit, and accessories',
    defaultPriority: 'high',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      { title: 'Install furnace/air handler' },
      { title: 'Install condensing unit' },
      { title: 'Run refrigerant lines' },
      { title: 'Install thermostat' },
      { title: 'Install registers and grilles' },
      { title: 'Charge system' },
      { title: 'Test operation' },
    ],
  },

  // Drywall
  {
    name: 'Drywall Hang',
    trade: 'Drywall',
    category: 'Drywall',
    defaultTitle: 'Hang Drywall',
    defaultDescription: 'Install drywall panels',
    defaultPriority: 'medium',
    defaultEstimatedHours: 16,
    defaultChecklist: [
      { title: 'Verify framing is complete' },
      { title: 'Install ceiling drywall' },
      { title: 'Install wall drywall' },
      { title: 'Cut around outlets/switches' },
      { title: 'Screw off all panels' },
    ],
  },
  {
    name: 'Drywall Tape & Mud',
    trade: 'Drywall',
    category: 'Drywall',
    defaultTitle: 'Tape and Mud Drywall',
    defaultDescription: 'Tape joints and apply joint compound',
    defaultPriority: 'medium',
    defaultEstimatedHours: 24,
    defaultChecklist: [
      { title: 'Apply tape to all joints' },
      { title: 'First coat of mud' },
      { title: 'Second coat of mud' },
      { title: 'Third/finish coat' },
      { title: 'Sand smooth' },
      { title: 'Touch up as needed' },
    ],
  },

  // Paint
  {
    name: 'Interior Painting',
    trade: 'Painting',
    category: 'Painting',
    defaultTitle: 'Paint Interior',
    defaultDescription: 'Paint walls, ceilings, and trim',
    defaultPriority: 'medium',
    defaultEstimatedHours: 16,
    defaultChecklist: [
      { title: 'Repair any wall damage' },
      { title: 'Mask trim and protect floors' },
      { title: 'Prime walls if needed' },
      { title: 'Paint ceilings' },
      { title: 'Paint walls - first coat' },
      { title: 'Paint walls - second coat' },
      { title: 'Paint trim' },
      { title: 'Touch up and clean up' },
    ],
  },

  // Flooring
  {
    name: 'Flooring Installation',
    trade: 'Flooring',
    category: 'Flooring',
    defaultTitle: 'Install Flooring',
    defaultDescription: 'Install finish flooring material',
    defaultPriority: 'medium',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      { title: 'Prep subfloor' },
      { title: 'Acclimate flooring material' },
      { title: 'Install underlayment if needed' },
      { title: 'Install flooring' },
      { title: 'Install transitions' },
      { title: 'Install baseboards' },
      { title: 'Clean and inspect' },
    ],
  },

  // Tile
  {
    name: 'Tile Installation',
    trade: 'Tile',
    category: 'Tile',
    defaultTitle: 'Install Tile',
    defaultDescription: 'Install tile floor or wall',
    defaultPriority: 'medium',
    defaultEstimatedHours: 16,
    defaultChecklist: [
      { title: 'Prep substrate' },
      { title: 'Waterproof as needed' },
      { title: 'Lay out tile pattern' },
      { title: 'Spread thinset' },
      { title: 'Set tiles with spacers' },
      { title: 'Allow to cure' },
      { title: 'Grout joints' },
      { title: 'Seal grout' },
      { title: 'Caulk corners and transitions' },
    ],
  },

  // Cabinetry
  {
    name: 'Cabinet Installation',
    trade: 'Cabinetry',
    category: 'Cabinetry',
    defaultTitle: 'Install Cabinets',
    defaultDescription: 'Install kitchen or bathroom cabinets',
    defaultPriority: 'high',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      { title: 'Verify cabinet delivery complete' },
      { title: 'Mark level lines on walls' },
      { title: 'Install upper cabinets' },
      { title: 'Install base cabinets' },
      { title: 'Level and shim' },
      { title: 'Install fillers and panels' },
      { title: 'Adjust doors and drawers' },
      { title: 'Install hardware' },
    ],
  },

  // Countertops
  {
    name: 'Countertop Installation',
    trade: 'Countertops',
    category: 'Countertops',
    defaultTitle: 'Install Countertops',
    defaultDescription: 'Template and install countertops',
    defaultPriority: 'high',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      { title: 'Verify cabinets are level' },
      { title: 'Template countertops' },
      { title: 'Cut sink/cooktop openings' },
      { title: 'Install countertops' },
      { title: 'Install backsplash if included' },
      { title: 'Seal edges and seams' },
    ],
  },

  // Final
  {
    name: 'Final Walkthrough',
    trade: 'General',
    category: 'Closeout',
    defaultTitle: 'Final Walkthrough',
    defaultDescription: 'Complete final walkthrough with client',
    defaultPriority: 'high',
    defaultEstimatedHours: 2,
    defaultChecklist: [
      { title: 'Review all work with client' },
      { title: 'Create punch list' },
      { title: 'Demonstrate equipment operation' },
      { title: 'Provide warranty information' },
      { title: 'Collect final payment' },
      { title: 'Hand over keys' },
    ],
  },
  {
    name: 'Punch List',
    trade: 'General',
    category: 'Closeout',
    defaultTitle: 'Complete Punch List',
    defaultDescription: 'Address all punch list items',
    defaultPriority: 'high',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      { title: 'Review punch list items' },
      { title: 'Complete all corrections' },
      { title: 'Document completed items' },
      { title: 'Schedule re-inspection' },
    ],
  },
];

// Get all unique trades from templates
export function getUniqueTrades(): string[] {
  const trades = new Set<string>();
  DEFAULT_TASK_TEMPLATES.forEach(t => {
    if (t.trade) trades.add(t.trade);
  });
  return Array.from(trades).sort();
}

// Get all unique categories from templates
export function getUniqueCategories(): string[] {
  const categories = new Set<string>();
  DEFAULT_TASK_TEMPLATES.forEach(t => {
    if (t.category) categories.add(t.category);
  });
  return Array.from(categories).sort();
}

// Get templates by trade
export function getTemplatesByTrade(trade: string): DefaultTaskTemplate[] {
  return DEFAULT_TASK_TEMPLATES.filter(t => t.trade === trade);
}

// Get templates by category
export function getTemplatesByCategory(category: string): DefaultTaskTemplate[] {
  return DEFAULT_TASK_TEMPLATES.filter(t => t.category === category);
}
