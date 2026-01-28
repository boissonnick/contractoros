import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ScopeItem, ScopeMaterial } from '@/types';

export interface SowTemplateData {
  id?: string;
  orgId: string;
  name: string;
  description: string;
  projectType: string;
  items: Omit<ScopeItem, 'id'>[];
  createdAt?: Date;
}

function mat(name: string, quantity: number, unit: string, cost: number): ScopeMaterial {
  return { name, quantity, unit, estimatedCost: cost };
}

function item(title: string, desc: string, hours: number, cost: number, materials: ScopeMaterial[] = [], order: number): Omit<ScopeItem, 'id'> {
  return {
    phaseId: '',
    title,
    description: desc,
    specifications: '',
    materials,
    laborDescription: '',
    estimatedHours: hours,
    estimatedCost: cost,
    quoteSectionId: '',
    order,
  };
}

const DEFAULT_TEMPLATES: Omit<SowTemplateData, 'orgId'>[] = [
  {
    name: 'Kitchen Remodel',
    description: 'Standard kitchen renovation including cabinets, countertops, appliances, and finishes',
    projectType: 'single_room',
    items: [
      item('Demo existing kitchen', 'Remove cabinets, countertops, backsplash, flooring', 16, 2400, [mat('Dumpster rental', 1, 'unit', 500)], 0),
      item('Rough plumbing', 'Relocate/update water supply and drain lines', 12, 3200, [mat('PEX piping', 50, 'ft', 150), mat('Fittings', 1, 'lot', 200)], 1),
      item('Rough electrical', 'Update circuits for appliances, add outlets, under-cabinet lighting', 10, 2800, [mat('Wire/boxes', 1, 'lot', 300), mat('Breakers', 4, 'ea', 200)], 2),
      item('Cabinet installation', 'Install base and wall cabinets per design', 20, 4500, [mat('Cabinets', 1, 'set', 8000)], 3),
      item('Countertop fabrication & install', 'Template, fabricate, and install countertops', 8, 2000, [mat('Granite/quartz slab', 45, 'sqft', 4500)], 4),
      item('Tile backsplash', 'Install subway or mosaic tile backsplash', 12, 1800, [mat('Tile', 30, 'sqft', 450), mat('Thinset/grout', 1, 'lot', 80)], 5),
      item('Flooring', 'Install LVP or tile flooring', 10, 1500, [mat('Flooring material', 150, 'sqft', 1200), mat('Underlayment', 150, 'sqft', 150)], 6),
      item('Appliance installation', 'Set and connect all kitchen appliances', 6, 900, [], 7),
      item('Paint & trim', 'Paint walls, install trim and crown molding', 8, 1200, [mat('Paint', 3, 'gal', 150), mat('Trim', 40, 'lnft', 200)], 8),
      item('Final plumbing', 'Install faucet, garbage disposal, dishwasher connection', 4, 800, [mat('Faucet', 1, 'ea', 350), mat('Disposal', 1, 'ea', 200)], 9),
    ],
  },
  {
    name: 'Bathroom Remodel',
    description: 'Full bathroom renovation with new fixtures, tile, and vanity',
    projectType: 'single_room',
    items: [
      item('Demo existing bathroom', 'Remove fixtures, tile, vanity, toilet', 8, 1200, [mat('Dumpster', 1, 'unit', 400)], 0),
      item('Rough plumbing', 'Update supply/drain for new layout', 10, 2800, [mat('Plumbing rough materials', 1, 'lot', 400)], 1),
      item('Rough electrical', 'GFCI outlets, exhaust fan, lighting circuits', 6, 1600, [mat('Electrical materials', 1, 'lot', 250)], 2),
      item('Waterproofing', 'Kerdi or liquid membrane in shower/tub area', 6, 900, [mat('Kerdi membrane', 1, 'kit', 350)], 3),
      item('Tile shower/tub surround', 'Install wall tile in wet area', 16, 2400, [mat('Tile', 80, 'sqft', 800), mat('Thinset/grout', 1, 'lot', 120)], 4),
      item('Floor tile', 'Install porcelain floor tile', 8, 1200, [mat('Floor tile', 50, 'sqft', 400)], 5),
      item('Vanity & mirror', 'Install vanity, countertop, mirror', 4, 600, [mat('Vanity', 1, 'ea', 800), mat('Mirror', 1, 'ea', 200)], 6),
      item('Fixtures & accessories', 'Toilet, faucet, shower valve, towel bars', 6, 900, [mat('Toilet', 1, 'ea', 400), mat('Faucet', 1, 'ea', 250), mat('Shower valve', 1, 'ea', 300)], 7),
      item('Paint & trim', 'Paint walls, install baseboard, door casing', 4, 600, [mat('Paint', 1, 'gal', 50), mat('Trim', 20, 'lnft', 100)], 8),
    ],
  },
  {
    name: 'Deck Build',
    description: 'New composite or wood deck with railing and stairs',
    projectType: 'addition',
    items: [
      item('Permit & design', 'Pull building permit, finalize deck plan', 4, 800, [mat('Permit fee', 1, 'ea', 300)], 0),
      item('Site prep & layout', 'Mark footings, grade area, dig holes', 8, 1200, [mat('Stakes/string', 1, 'lot', 30)], 1),
      item('Footings & posts', 'Pour concrete footings, set posts', 10, 1500, [mat('Concrete', 10, 'bag', 100), mat('Post brackets', 6, 'ea', 120), mat('6x6 posts', 6, 'ea', 180)], 2),
      item('Framing', 'Install ledger, beams, joists, blocking', 16, 2400, [mat('Lumber (PT)', 1, 'lot', 2000), mat('Joist hangers/hardware', 1, 'lot', 200)], 3),
      item('Decking', 'Install composite or wood deck boards', 12, 1800, [mat('Composite decking', 300, 'sqft', 3000), mat('Hidden fasteners', 1, 'box', 120)], 4),
      item('Railing', 'Install railing system with balusters', 10, 1500, [mat('Railing system', 40, 'lnft', 1600)], 5),
      item('Stairs', 'Build staircase with landing', 8, 1200, [mat('Stair stringers', 3, 'ea', 150), mat('Treads', 10, 'ea', 200)], 6),
      item('Final inspection', 'Schedule and pass building inspection', 2, 300, [], 7),
    ],
  },
  {
    name: 'Room Addition',
    description: 'Single room addition with foundation, framing, MEP, and finishes',
    projectType: 'addition',
    items: [
      item('Design & permits', 'Architectural plans and building permit', 8, 3500, [mat('Permit fees', 1, 'ea', 1500)], 0),
      item('Foundation', 'Excavate, form, pour concrete slab/stem wall', 20, 5000, [mat('Concrete', 8, 'yd', 1200), mat('Rebar', 1, 'lot', 400), mat('Formwork', 1, 'lot', 600)], 1),
      item('Framing', 'Walls, ceiling joists, roof tie-in', 32, 6000, [mat('Framing lumber', 1, 'lot', 4000), mat('Hardware', 1, 'lot', 500)], 2),
      item('Roofing', 'Extend roof, sheathing, shingles, flashing', 16, 3500, [mat('Shingles', 5, 'sq', 750), mat('Sheathing', 1, 'lot', 400)], 3),
      item('Windows & exterior door', 'Install windows and exterior door', 8, 1500, [mat('Windows', 2, 'ea', 1200), mat('Exterior door', 1, 'ea', 800)], 4),
      item('MEP rough-in', 'Electrical, plumbing, HVAC rough', 24, 6000, [mat('MEP materials', 1, 'lot', 2000)], 5),
      item('Insulation & drywall', 'Insulate walls/ceiling, hang and finish drywall', 16, 3000, [mat('Insulation', 1, 'lot', 800), mat('Drywall', 1, 'lot', 600)], 6),
      item('Interior finishes', 'Paint, flooring, trim, fixtures', 20, 4000, [mat('Paint', 5, 'gal', 250), mat('Flooring', 200, 'sqft', 1600), mat('Trim', 80, 'lnft', 400)], 7),
    ],
  },
  {
    name: 'Roofing Replacement',
    description: 'Complete tear-off and re-roof with new shingles',
    projectType: 'full_renovation',
    items: [
      item('Tear-off existing roof', 'Remove old shingles, felt, flashing down to sheathing', 12, 2400, [mat('Dumpster', 1, 'ea', 600)], 0),
      item('Inspect & repair sheathing', 'Replace damaged plywood/OSB', 6, 1200, [mat('Plywood sheets', 10, 'ea', 500)], 1),
      item('Ice & water shield', 'Install ice/water membrane at eaves and valleys', 4, 800, [mat('Ice & water shield', 2, 'roll', 300)], 2),
      item('Underlayment', 'Install synthetic felt over entire roof', 4, 600, [mat('Synthetic felt', 4, 'roll', 400)], 3),
      item('Drip edge & flashing', 'Install new drip edge, valley/step flashing', 6, 1000, [mat('Drip edge', 150, 'lnft', 200), mat('Flashing', 1, 'lot', 300)], 4),
      item('Shingle installation', 'Install architectural shingles per manufacturer spec', 24, 4800, [mat('Shingles', 30, 'sq', 3600), mat('Nails', 1, 'box', 60)], 5),
      item('Ridge vent & caps', 'Install ridge vent and hip/ridge caps', 4, 800, [mat('Ridge vent', 30, 'lnft', 200), mat('Ridge caps', 1, 'bdl', 150)], 6),
      item('Cleanup & inspection', 'Magnetic sweep, gutter clean, final inspection', 4, 600, [], 7),
    ],
  },
  {
    name: 'HVAC System Replacement',
    description: 'Full HVAC system replacement including furnace, AC, and ductwork',
    projectType: 'full_renovation',
    items: [
      item('Remove existing system', 'Disconnect and remove old furnace, AC unit, thermostat', 8, 1200, [], 0),
      item('Install furnace/air handler', 'Set new high-efficiency furnace or air handler', 8, 2000, [mat('Furnace/AH unit', 1, 'ea', 3500)], 1),
      item('Install condenser', 'Set outdoor AC condenser unit on pad', 6, 1500, [mat('Condenser unit', 1, 'ea', 3000), mat('Concrete pad', 1, 'ea', 100)], 2),
      item('Refrigerant lines', 'Run new lineset between units', 4, 800, [mat('Lineset', 1, 'set', 200)], 3),
      item('Ductwork modifications', 'Modify or replace ductwork as needed', 12, 2400, [mat('Ductwork', 1, 'lot', 1200)], 4),
      item('Thermostat & controls', 'Install smart thermostat, wire controls', 3, 500, [mat('Smart thermostat', 1, 'ea', 250)], 5),
      item('Startup & commissioning', 'Charge system, test, set airflow, verify operation', 4, 800, [mat('Refrigerant', 1, 'lot', 150)], 6),
      item('Permit & inspection', 'Pull HVAC permit, schedule inspection', 2, 400, [mat('Permit fee', 1, 'ea', 200)], 7),
    ],
  },
];

export async function ensureSowTemplates(orgId: string): Promise<SowTemplateData[]> {
  const existing = await getDocs(
    query(collection(db, 'sowTemplates'), where('orgId', '==', orgId))
  );

  if (existing.size > 0) {
    return existing.docs.map(d => ({ id: d.id, ...d.data() }) as SowTemplateData);
  }

  // Seed defaults
  const created: SowTemplateData[] = [];
  for (const tmpl of DEFAULT_TEMPLATES) {
    const docRef = await addDoc(collection(db, 'sowTemplates'), {
      ...tmpl,
      orgId,
      createdAt: Timestamp.now(),
    });
    created.push({ id: docRef.id, ...tmpl, orgId });
  }

  return created;
}
