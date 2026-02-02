/**
 * Realistic scope items and line item templates for different project types
 * Used by seed-estimates.ts to generate professional estimates
 */

export interface LineItemTemplate {
  description: string;
  category: string;
  laborHours: number;
  materialsCost: number;
  unit: string;
  quantity: number;
}

// ============================================
// Kitchen Remodel Items
// ============================================

export const KITCHEN_REMODEL_ITEMS: LineItemTemplate[] = [
  // Demo
  { description: 'Demo existing cabinets, countertops, and backsplash', category: 'Demolition', laborHours: 16, materialsCost: 150, unit: 'ls', quantity: 1 },
  { description: 'Remove existing flooring', category: 'Demolition', laborHours: 8, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Haul away debris (2 loads)', category: 'Demolition', laborHours: 4, materialsCost: 450, unit: 'load', quantity: 2 },
  // Electrical
  { description: 'Electrical rough-in for under-cabinet lighting', category: 'Electrical', laborHours: 8, materialsCost: 350, unit: 'ls', quantity: 1 },
  { description: 'Install recessed lighting (6 cans)', category: 'Electrical', laborHours: 12, materialsCost: 480, unit: 'ea', quantity: 6 },
  { description: 'Add dedicated 20A circuits for appliances', category: 'Electrical', laborHours: 8, materialsCost: 280, unit: 'ea', quantity: 3 },
  // Plumbing
  { description: 'Rough plumbing for sink relocation', category: 'Plumbing', laborHours: 6, materialsCost: 180, unit: 'ls', quantity: 1 },
  { description: 'Install garbage disposal', category: 'Plumbing', laborHours: 2, materialsCost: 185, unit: 'ea', quantity: 1 },
  { description: 'Connect dishwasher', category: 'Plumbing', laborHours: 2, materialsCost: 45, unit: 'ea', quantity: 1 },
  // Cabinets
  { description: 'Install base cabinets', category: 'Cabinets', laborHours: 24, materialsCost: 4800, unit: 'lf', quantity: 14 },
  { description: 'Install wall cabinets', category: 'Cabinets', laborHours: 16, materialsCost: 3200, unit: 'lf', quantity: 12 },
  { description: 'Install cabinet hardware', category: 'Cabinets', laborHours: 4, materialsCost: 320, unit: 'ls', quantity: 1 },
  // Countertops
  { description: 'Fabricate and install quartz countertops', category: 'Countertops', laborHours: 8, materialsCost: 4500, unit: 'sf', quantity: 45 },
  { description: 'Undermount sink cutout and installation', category: 'Countertops', laborHours: 4, materialsCost: 450, unit: 'ea', quantity: 1 },
  // Backsplash
  { description: 'Install subway tile backsplash', category: 'Tile', laborHours: 16, materialsCost: 680, unit: 'sf', quantity: 32 },
  { description: 'Tile grout and sealing', category: 'Tile', laborHours: 4, materialsCost: 85, unit: 'ls', quantity: 1 },
  // Flooring
  { description: 'Install LVP flooring', category: 'Flooring', laborHours: 16, materialsCost: 1450, unit: 'sf', quantity: 180 },
  { description: 'Install transition strips', category: 'Flooring', laborHours: 2, materialsCost: 120, unit: 'ls', quantity: 1 },
  // Painting
  { description: 'Paint walls and ceiling (2 coats)', category: 'Paint', laborHours: 12, materialsCost: 280, unit: 'ls', quantity: 1 },
  { description: 'Paint trim and casing', category: 'Paint', laborHours: 6, materialsCost: 120, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Install under-cabinet lighting', category: 'Electrical', laborHours: 4, materialsCost: 380, unit: 'ls', quantity: 1 },
  { description: 'Final cleaning', category: 'General', laborHours: 4, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Bathroom Remodel Items
// ============================================

export const BATHROOM_REMODEL_ITEMS: LineItemTemplate[] = [
  // Demo
  { description: 'Demo existing tub/shower, vanity, toilet, flooring', category: 'Demolition', laborHours: 12, materialsCost: 100, unit: 'ls', quantity: 1 },
  { description: 'Haul away debris', category: 'Demolition', laborHours: 3, materialsCost: 225, unit: 'load', quantity: 1 },
  // Plumbing
  { description: 'Rough plumbing for new layout', category: 'Plumbing', laborHours: 8, materialsCost: 420, unit: 'ls', quantity: 1 },
  { description: 'Install new tub/shower valve', category: 'Plumbing', laborHours: 4, materialsCost: 380, unit: 'ea', quantity: 1 },
  { description: 'Install toilet', category: 'Plumbing', laborHours: 2, materialsCost: 385, unit: 'ea', quantity: 1 },
  { description: 'Install vanity faucet', category: 'Plumbing', laborHours: 2, materialsCost: 245, unit: 'ea', quantity: 1 },
  // Electrical
  { description: 'Install exhaust fan (humidity sensing)', category: 'Electrical', laborHours: 4, materialsCost: 185, unit: 'ea', quantity: 1 },
  { description: 'Install vanity light fixture', category: 'Electrical', laborHours: 2, materialsCost: 165, unit: 'ea', quantity: 1 },
  { description: 'Install GFCI outlets', category: 'Electrical', laborHours: 3, materialsCost: 90, unit: 'ea', quantity: 2 },
  // Tile
  { description: 'Install shower wall tile', category: 'Tile', laborHours: 24, materialsCost: 1200, unit: 'sf', quantity: 80 },
  { description: 'Install floor tile', category: 'Tile', laborHours: 12, materialsCost: 520, unit: 'sf', quantity: 48 },
  { description: 'Install shower niche', category: 'Tile', laborHours: 4, materialsCost: 180, unit: 'ea', quantity: 1 },
  { description: 'Grout and seal all tile', category: 'Tile', laborHours: 6, materialsCost: 95, unit: 'ls', quantity: 1 },
  // Vanity
  { description: 'Install vanity cabinet', category: 'Cabinets', laborHours: 4, materialsCost: 850, unit: 'ea', quantity: 1 },
  { description: 'Install vanity countertop', category: 'Countertops', laborHours: 3, materialsCost: 480, unit: 'ea', quantity: 1 },
  { description: 'Install mirror', category: 'Accessories', laborHours: 1, materialsCost: 220, unit: 'ea', quantity: 1 },
  // Shower
  { description: 'Install frameless glass shower door', category: 'Glass', laborHours: 4, materialsCost: 1450, unit: 'ea', quantity: 1 },
  { description: 'Install shower accessories (grab bar, shelf)', category: 'Accessories', laborHours: 2, materialsCost: 180, unit: 'ls', quantity: 1 },
  // Paint
  { description: 'Paint ceiling and accent wall', category: 'Paint', laborHours: 4, materialsCost: 85, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Install towel bars and accessories', category: 'Accessories', laborHours: 2, materialsCost: 145, unit: 'ls', quantity: 1 },
  { description: 'Final cleaning and caulking', category: 'General', laborHours: 3, materialsCost: 35, unit: 'ls', quantity: 1 },
];

// ============================================
// Deck Build Items
// ============================================

export const DECK_BUILD_ITEMS: LineItemTemplate[] = [
  // Site Prep
  { description: 'Layout and excavate for footings', category: 'Site Work', laborHours: 8, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Install concrete footings (8 total)', category: 'Concrete', laborHours: 12, materialsCost: 680, unit: 'ea', quantity: 8 },
  // Framing
  { description: 'Install ledger board with flashing', category: 'Framing', laborHours: 8, materialsCost: 420, unit: 'lf', quantity: 16 },
  { description: 'Install beam and post structure', category: 'Framing', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install joists and blocking', category: 'Framing', laborHours: 24, materialsCost: 1850, unit: 'ls', quantity: 1 },
  // Decking
  { description: 'Install composite decking', category: 'Decking', laborHours: 32, materialsCost: 4200, unit: 'sf', quantity: 320 },
  { description: 'Install fascia and picture frame border', category: 'Decking', laborHours: 8, materialsCost: 480, unit: 'lf', quantity: 64 },
  // Railing
  { description: 'Install composite railing system', category: 'Railing', laborHours: 16, materialsCost: 2100, unit: 'lf', quantity: 48 },
  { description: 'Install post caps', category: 'Railing', laborHours: 2, materialsCost: 180, unit: 'ea', quantity: 12 },
  // Stairs
  { description: 'Build and install deck stairs (4 steps)', category: 'Stairs', laborHours: 12, materialsCost: 680, unit: 'ls', quantity: 1 },
  { description: 'Install stair railing', category: 'Railing', laborHours: 4, materialsCost: 420, unit: 'lf', quantity: 8 },
  // Electrical
  { description: 'Install low-voltage deck lighting', category: 'Electrical', laborHours: 8, materialsCost: 580, unit: 'ls', quantity: 1 },
  { description: 'Install exterior GFCI outlet', category: 'Electrical', laborHours: 4, materialsCost: 185, unit: 'ea', quantity: 1 },
  // Finish
  { description: 'Final inspection and touch-up', category: 'General', laborHours: 4, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Commercial Tenant Improvement Items
// ============================================

export const COMMERCIAL_TI_ITEMS: LineItemTemplate[] = [
  // Demo
  { description: 'Selective demo of existing partitions', category: 'Demolition', laborHours: 32, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Demo existing flooring', category: 'Demolition', laborHours: 16, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Debris removal and disposal', category: 'Demolition', laborHours: 8, materialsCost: 850, unit: 'load', quantity: 3 },
  // Framing
  { description: 'Metal stud framing for new walls', category: 'Framing', laborHours: 48, materialsCost: 2400, unit: 'lf', quantity: 180 },
  { description: 'Frame new office/conference rooms', category: 'Framing', laborHours: 24, materialsCost: 1200, unit: 'ls', quantity: 1 },
  // Drywall
  { description: 'Hang and finish drywall', category: 'Drywall', laborHours: 80, materialsCost: 3600, unit: 'sf', quantity: 4500 },
  { description: 'Install sound insulation', category: 'Insulation', laborHours: 16, materialsCost: 1800, unit: 'sf', quantity: 1200 },
  // Electrical
  { description: 'Electrical rough-in for new layout', category: 'Electrical', laborHours: 40, materialsCost: 3200, unit: 'ls', quantity: 1 },
  { description: 'Install LED 2x4 troffer lights', category: 'Electrical', laborHours: 24, materialsCost: 4800, unit: 'ea', quantity: 32 },
  { description: 'Install outlets and data drops', category: 'Electrical', laborHours: 32, materialsCost: 2400, unit: 'ea', quantity: 48 },
  // HVAC
  { description: 'Extend HVAC ductwork', category: 'HVAC', laborHours: 24, materialsCost: 2800, unit: 'ls', quantity: 1 },
  { description: 'Install new supply registers', category: 'HVAC', laborHours: 8, materialsCost: 480, unit: 'ea', quantity: 8 },
  { description: 'Add zone thermostat', category: 'HVAC', laborHours: 4, materialsCost: 380, unit: 'ea', quantity: 2 },
  // Flooring
  { description: 'Install commercial LVT flooring', category: 'Flooring', laborHours: 32, materialsCost: 7200, unit: 'sf', quantity: 1800 },
  { description: 'Install carpet tile in offices', category: 'Flooring', laborHours: 16, materialsCost: 3400, unit: 'sf', quantity: 800 },
  { description: 'Install base trim', category: 'Flooring', laborHours: 8, materialsCost: 720, unit: 'lf', quantity: 360 },
  // Paint
  { description: 'Prime and paint walls (2 coats)', category: 'Paint', laborHours: 40, materialsCost: 1200, unit: 'sf', quantity: 4500 },
  { description: 'Paint accent walls', category: 'Paint', laborHours: 8, materialsCost: 280, unit: 'ls', quantity: 1 },
  // Doors
  { description: 'Install commercial interior doors', category: 'Doors', laborHours: 16, materialsCost: 2400, unit: 'ea', quantity: 8 },
  { description: 'Install door hardware', category: 'Doors', laborHours: 8, materialsCost: 960, unit: 'ea', quantity: 8 },
  // Millwork
  { description: 'Install reception desk', category: 'Millwork', laborHours: 16, materialsCost: 3800, unit: 'ls', quantity: 1 },
  { description: 'Install break room cabinets', category: 'Cabinets', laborHours: 8, materialsCost: 2200, unit: 'ls', quantity: 1 },
  // Fire/Safety
  { description: 'Fire alarm modifications', category: 'Fire Safety', laborHours: 8, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install exit signage', category: 'Fire Safety', laborHours: 4, materialsCost: 480, unit: 'ea', quantity: 4 },
  // Finish
  { description: 'Final cleaning', category: 'General', laborHours: 16, materialsCost: 450, unit: 'ls', quantity: 1 },
  { description: 'Punch list and inspection', category: 'General', laborHours: 8, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Fence Installation Items
// ============================================

export const FENCE_INSTALLATION_ITEMS: LineItemTemplate[] = [
  // Site Prep
  { description: 'Locate utilities (811 call)', category: 'Site Work', laborHours: 1, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Layout and mark fence line', category: 'Site Work', laborHours: 2, materialsCost: 0, unit: 'ls', quantity: 1 },
  // Posts
  { description: 'Dig post holes (18" diameter x 36" deep)', category: 'Site Work', laborHours: 12, materialsCost: 0, unit: 'ea', quantity: 24 },
  { description: 'Set 4x4 cedar posts in concrete', category: 'Fence', laborHours: 8, materialsCost: 1440, unit: 'ea', quantity: 24 },
  // Rails
  { description: 'Install 2x4 horizontal rails', category: 'Fence', laborHours: 8, materialsCost: 680, unit: 'lf', quantity: 420 },
  // Pickets
  { description: 'Install 6\' cedar pickets', category: 'Fence', laborHours: 24, materialsCost: 2800, unit: 'lf', quantity: 140 },
  // Gate
  { description: 'Build and install 4\' wide gate', category: 'Fence', laborHours: 6, materialsCost: 380, unit: 'ea', quantity: 1 },
  { description: 'Install gate hardware (hinges, latch)', category: 'Hardware', laborHours: 2, materialsCost: 120, unit: 'ea', quantity: 1 },
  // Finish
  { description: 'Apply wood stain/sealer', category: 'Finish', laborHours: 8, materialsCost: 320, unit: 'ls', quantity: 1 },
  { description: 'Site cleanup', category: 'General', laborHours: 2, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Basement Finish Items
// ============================================

export const BASEMENT_FINISH_ITEMS: LineItemTemplate[] = [
  // Framing
  { description: 'Frame exterior walls with moisture barrier', category: 'Framing', laborHours: 24, materialsCost: 1800, unit: 'lf', quantity: 120 },
  { description: 'Frame interior walls', category: 'Framing', laborHours: 16, materialsCost: 960, unit: 'lf', quantity: 80 },
  { description: 'Frame bulkheads for utilities', category: 'Framing', laborHours: 8, materialsCost: 380, unit: 'ls', quantity: 1 },
  // Insulation
  { description: 'Install R-19 wall insulation', category: 'Insulation', laborHours: 12, materialsCost: 1450, unit: 'sf', quantity: 720 },
  { description: 'Install vapor barrier', category: 'Insulation', laborHours: 6, materialsCost: 280, unit: 'sf', quantity: 720 },
  // Electrical
  { description: 'Electrical rough-in', category: 'Electrical', laborHours: 24, materialsCost: 1800, unit: 'ls', quantity: 1 },
  { description: 'Install recessed lighting', category: 'Electrical', laborHours: 12, materialsCost: 960, unit: 'ea', quantity: 12 },
  { description: 'Install outlets and switches', category: 'Electrical', laborHours: 8, materialsCost: 480, unit: 'ea', quantity: 16 },
  // Plumbing
  { description: 'Rough plumbing for bathroom', category: 'Plumbing', laborHours: 12, materialsCost: 850, unit: 'ls', quantity: 1 },
  { description: 'Install toilet', category: 'Plumbing', laborHours: 3, materialsCost: 320, unit: 'ea', quantity: 1 },
  { description: 'Install vanity and faucet', category: 'Plumbing', laborHours: 4, materialsCost: 680, unit: 'ea', quantity: 1 },
  // HVAC
  { description: 'Extend HVAC to basement', category: 'HVAC', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install registers and returns', category: 'HVAC', laborHours: 6, materialsCost: 320, unit: 'ea', quantity: 4 },
  // Drywall
  { description: 'Hang drywall on walls and ceiling', category: 'Drywall', laborHours: 48, materialsCost: 2400, unit: 'sf', quantity: 2400 },
  { description: 'Tape, mud, and sand (Level 4 finish)', category: 'Drywall', laborHours: 32, materialsCost: 480, unit: 'sf', quantity: 2400 },
  // Flooring
  { description: 'Install LVP flooring', category: 'Flooring', laborHours: 20, materialsCost: 2800, unit: 'sf', quantity: 800 },
  { description: 'Install base trim', category: 'Flooring', laborHours: 6, materialsCost: 380, unit: 'lf', quantity: 200 },
  // Bathroom Tile
  { description: 'Install shower tile', category: 'Tile', laborHours: 16, materialsCost: 720, unit: 'sf', quantity: 48 },
  { description: 'Install bathroom floor tile', category: 'Tile', laborHours: 8, materialsCost: 320, unit: 'sf', quantity: 35 },
  // Doors
  { description: 'Install interior doors with trim', category: 'Doors', laborHours: 12, materialsCost: 900, unit: 'ea', quantity: 3 },
  // Paint
  { description: 'Prime and paint walls (2 coats)', category: 'Paint', laborHours: 24, materialsCost: 680, unit: 'ls', quantity: 1 },
  { description: 'Paint trim and doors', category: 'Paint', laborHours: 8, materialsCost: 180, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Final electrical trim', category: 'Electrical', laborHours: 4, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Final cleaning and inspection', category: 'General', laborHours: 6, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Garage Addition Items
// ============================================

export const GARAGE_ADDITION_ITEMS: LineItemTemplate[] = [
  // Site Work
  { description: 'Excavation and grading', category: 'Site Work', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Pour concrete footings', category: 'Concrete', laborHours: 12, materialsCost: 2400, unit: 'ls', quantity: 1 },
  // Foundation
  { description: 'Pour concrete slab (4" with mesh)', category: 'Concrete', laborHours: 24, materialsCost: 4800, unit: 'sf', quantity: 576 },
  { description: 'Stem wall construction', category: 'Concrete', laborHours: 16, materialsCost: 1800, unit: 'lf', quantity: 96 },
  // Framing
  { description: 'Frame walls', category: 'Framing', laborHours: 32, materialsCost: 3600, unit: 'lf', quantity: 96 },
  { description: 'Frame roof (hip/gable)', category: 'Framing', laborHours: 40, materialsCost: 4200, unit: 'sf', quantity: 650 },
  { description: 'Install sheathing', category: 'Framing', laborHours: 16, materialsCost: 1800, unit: 'sf', quantity: 1200 },
  // Exterior
  { description: 'Install house wrap', category: 'Exterior', laborHours: 8, materialsCost: 380, unit: 'sf', quantity: 960 },
  { description: 'Install siding to match existing', category: 'Exterior', laborHours: 32, materialsCost: 4200, unit: 'sf', quantity: 960 },
  { description: 'Install fascia and soffit', category: 'Exterior', laborHours: 16, materialsCost: 1450, unit: 'lf', quantity: 100 },
  // Roofing
  { description: 'Install roofing underlayment', category: 'Roofing', laborHours: 8, materialsCost: 420, unit: 'sf', quantity: 650 },
  { description: 'Install asphalt shingles to match', category: 'Roofing', laborHours: 24, materialsCost: 2600, unit: 'sf', quantity: 650 },
  { description: 'Install flashing and tie-in to existing', category: 'Roofing', laborHours: 8, materialsCost: 380, unit: 'ls', quantity: 1 },
  // Garage Door
  { description: 'Install 16\'x7\' insulated garage door', category: 'Doors', laborHours: 8, materialsCost: 1800, unit: 'ea', quantity: 1 },
  { description: 'Install garage door opener', category: 'Doors', laborHours: 4, materialsCost: 450, unit: 'ea', quantity: 1 },
  // Electrical
  { description: 'Electrical service and panel', category: 'Electrical', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install lighting and outlets', category: 'Electrical', laborHours: 12, materialsCost: 680, unit: 'ls', quantity: 1 },
  // Drywall
  { description: 'Hang and finish drywall (fire-rated)', category: 'Drywall', laborHours: 32, materialsCost: 1800, unit: 'sf', quantity: 960 },
  // Entry Door
  { description: 'Install entry door with hardware', category: 'Doors', laborHours: 6, materialsCost: 680, unit: 'ea', quantity: 1 },
  // Paint
  { description: 'Prime and paint interior', category: 'Paint', laborHours: 12, materialsCost: 380, unit: 'ls', quantity: 1 },
  { description: 'Paint exterior trim', category: 'Paint', laborHours: 8, materialsCost: 280, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Final grading and cleanup', category: 'Site Work', laborHours: 8, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Final inspection', category: 'General', laborHours: 4, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Pool House Items
// ============================================

export const POOL_HOUSE_ITEMS: LineItemTemplate[] = [
  // Site Work
  { description: 'Site preparation and excavation', category: 'Site Work', laborHours: 16, materialsCost: 800, unit: 'ls', quantity: 1 },
  { description: 'Pour concrete slab foundation', category: 'Concrete', laborHours: 20, materialsCost: 3200, unit: 'sf', quantity: 400 },
  // Framing
  { description: 'Frame walls', category: 'Framing', laborHours: 24, materialsCost: 2400, unit: 'lf', quantity: 80 },
  { description: 'Frame roof with exposed beams', category: 'Framing', laborHours: 32, materialsCost: 3600, unit: 'sf', quantity: 450 },
  // Exterior
  { description: 'Install board and batten siding', category: 'Exterior', laborHours: 24, materialsCost: 3200, unit: 'sf', quantity: 640 },
  { description: 'Install standing seam metal roofing', category: 'Roofing', laborHours: 24, materialsCost: 4500, unit: 'sf', quantity: 450 },
  // Windows/Doors
  { description: 'Install bi-fold patio doors', category: 'Doors', laborHours: 12, materialsCost: 4800, unit: 'ea', quantity: 1 },
  { description: 'Install windows', category: 'Windows', laborHours: 8, materialsCost: 1600, unit: 'ea', quantity: 4 },
  { description: 'Install exterior door', category: 'Doors', laborHours: 4, materialsCost: 680, unit: 'ea', quantity: 1 },
  // Electrical
  { description: 'Electrical service to pool house', category: 'Electrical', laborHours: 16, materialsCost: 1800, unit: 'ls', quantity: 1 },
  { description: 'Install outlets and lighting', category: 'Electrical', laborHours: 12, materialsCost: 960, unit: 'ls', quantity: 1 },
  { description: 'Install ceiling fan', category: 'Electrical', laborHours: 3, materialsCost: 380, unit: 'ea', quantity: 2 },
  // Plumbing
  { description: 'Run water line to pool house', category: 'Plumbing', laborHours: 12, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install outdoor shower', category: 'Plumbing', laborHours: 8, materialsCost: 850, unit: 'ea', quantity: 1 },
  { description: 'Install bathroom plumbing', category: 'Plumbing', laborHours: 12, materialsCost: 1200, unit: 'ls', quantity: 1 },
  // Interior Finish
  { description: 'Install tongue and groove ceiling', category: 'Interior', laborHours: 16, materialsCost: 1800, unit: 'sf', quantity: 400 },
  { description: 'Install drywall and finish', category: 'Drywall', laborHours: 24, materialsCost: 1200, unit: 'sf', quantity: 640 },
  { description: 'Install bathroom tile', category: 'Tile', laborHours: 16, materialsCost: 1200, unit: 'sf', quantity: 80 },
  // Flooring
  { description: 'Install polished concrete floor', category: 'Flooring', laborHours: 12, materialsCost: 2400, unit: 'sf', quantity: 400 },
  // Kitchenette
  { description: 'Install mini kitchen cabinets', category: 'Cabinets', laborHours: 8, materialsCost: 1600, unit: 'lf', quantity: 8 },
  { description: 'Install countertop', category: 'Countertops', laborHours: 4, materialsCost: 1200, unit: 'sf', quantity: 16 },
  // Paint
  { description: 'Paint interior and exterior', category: 'Paint', laborHours: 16, materialsCost: 580, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Final inspection and cleanup', category: 'General', laborHours: 6, materialsCost: 0, unit: 'ls', quantity: 1 },
];

// ============================================
// Retail Storefront Items
// ============================================

export const RETAIL_STOREFRONT_ITEMS: LineItemTemplate[] = [
  // Demo
  { description: 'Complete gut demo of existing space', category: 'Demolition', laborHours: 48, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Remove existing storefront system', category: 'Demolition', laborHours: 16, materialsCost: 0, unit: 'ls', quantity: 1 },
  { description: 'Debris removal (5 loads)', category: 'Demolition', laborHours: 10, materialsCost: 1125, unit: 'load', quantity: 5 },
  // Storefront
  { description: 'Install aluminum storefront system', category: 'Storefront', laborHours: 40, materialsCost: 12000, unit: 'sf', quantity: 200 },
  { description: 'Install entry door system', category: 'Storefront', laborHours: 12, materialsCost: 3800, unit: 'ea', quantity: 1 },
  // Framing
  { description: 'Metal stud framing for partitions', category: 'Framing', laborHours: 32, materialsCost: 1800, unit: 'lf', quantity: 120 },
  { description: 'Frame dressing rooms', category: 'Framing', laborHours: 16, materialsCost: 960, unit: 'ea', quantity: 4 },
  // Drywall
  { description: 'Hang and finish drywall', category: 'Drywall', laborHours: 64, materialsCost: 3200, unit: 'sf', quantity: 4000 },
  // Electrical
  { description: 'Complete electrical rough-in', category: 'Electrical', laborHours: 48, materialsCost: 4800, unit: 'ls', quantity: 1 },
  { description: 'Install track lighting system', category: 'Electrical', laborHours: 24, materialsCost: 6400, unit: 'lf', quantity: 80 },
  { description: 'Install pendant lights', category: 'Electrical', laborHours: 8, materialsCost: 2400, unit: 'ea', quantity: 8 },
  { description: 'Install POS and network drops', category: 'Electrical', laborHours: 16, materialsCost: 1600, unit: 'ea', quantity: 8 },
  // HVAC
  { description: 'HVAC system for retail', category: 'HVAC', laborHours: 32, materialsCost: 8500, unit: 'ls', quantity: 1 },
  // Plumbing
  { description: 'Restroom rough plumbing', category: 'Plumbing', laborHours: 16, materialsCost: 1200, unit: 'ls', quantity: 1 },
  { description: 'Install toilet and vanity', category: 'Plumbing', laborHours: 6, materialsCost: 850, unit: 'ea', quantity: 1 },
  // Flooring
  { description: 'Install polished concrete flooring', category: 'Flooring', laborHours: 24, materialsCost: 7200, unit: 'sf', quantity: 2400 },
  // Paint
  { description: 'Paint walls and ceiling', category: 'Paint', laborHours: 32, materialsCost: 1600, unit: 'sf', quantity: 4000 },
  { description: 'Accent wall treatment', category: 'Paint', laborHours: 12, materialsCost: 800, unit: 'ls', quantity: 1 },
  // Millwork
  { description: 'Install custom checkout counter', category: 'Millwork', laborHours: 24, materialsCost: 5600, unit: 'ls', quantity: 1 },
  { description: 'Install display fixtures', category: 'Millwork', laborHours: 32, materialsCost: 8400, unit: 'ls', quantity: 1 },
  { description: 'Install shelving system', category: 'Millwork', laborHours: 24, materialsCost: 4800, unit: 'lf', quantity: 60 },
  // Signage
  { description: 'Install exterior signage', category: 'Signage', laborHours: 8, materialsCost: 3200, unit: 'ea', quantity: 1 },
  // ADA
  { description: 'ADA compliant restroom finishes', category: 'ADA', laborHours: 12, materialsCost: 1800, unit: 'ls', quantity: 1 },
  // Fire/Safety
  { description: 'Fire alarm and sprinkler tie-in', category: 'Fire Safety', laborHours: 16, materialsCost: 2400, unit: 'ls', quantity: 1 },
  // Finish
  { description: 'Final cleaning and punch list', category: 'General', laborHours: 16, materialsCost: 450, unit: 'ls', quantity: 1 },
];

// ============================================
// Standard Scope of Work Templates
// ============================================

export const SCOPE_OF_WORK_TEMPLATES = {
  kitchenRemodel: `
SCOPE OF WORK - Kitchen Remodel

1. DEMOLITION
   - Remove and dispose of existing cabinets, countertops, backsplash, and flooring
   - Protect adjacent areas during demolition
   - All debris to be hauled away to licensed facility

2. ELECTRICAL WORK
   - Install new recessed LED lighting per plan
   - Add under-cabinet lighting with dimmer switch
   - Install dedicated 20A circuits for appliances
   - All work to meet NEC code requirements

3. PLUMBING
   - Relocate sink plumbing as needed
   - Install new garbage disposal
   - Connect dishwasher water and drain

4. CABINETRY
   - Install owner-selected base and wall cabinets
   - All cabinets to be level and plumb
   - Install soft-close hardware throughout

5. COUNTERTOPS
   - Template, fabricate, and install quartz countertops
   - Include undermount sink cutout and polish
   - 4" backsplash at countertop/wall interface

6. TILE BACKSPLASH
   - Install subway tile backsplash per design
   - Grout with owner-selected color
   - Seal grout upon completion

7. FLOORING
   - Install luxury vinyl plank flooring
   - Include moisture barrier as needed
   - Coordinate transitions with adjacent rooms

8. PAINT
   - Paint walls and ceiling (2 coats over primer)
   - Paint trim and casing as needed
   - Owner to select colors

9. FINAL
   - Complete punch list items
   - Final cleaning
   - Walk-through with owner

EXCLUSIONS:
- Appliance purchase or installation (by others)
- Permits (if required, billed at cost)
- Any work not specifically listed above
`,

  bathroomRemodel: `
SCOPE OF WORK - Bathroom Remodel

1. DEMOLITION
   - Remove existing tub/shower, vanity, toilet, and flooring
   - Protect adjacent areas during work
   - Dispose of all debris

2. PLUMBING
   - Rough plumbing for new fixture locations
   - Install new tub/shower valve
   - Set new toilet
   - Install vanity plumbing and faucet

3. ELECTRICAL
   - Install humidity-sensing exhaust fan
   - Install new vanity light fixture
   - Install GFCI outlets per code
   - Add heated floor thermostat (if applicable)

4. TILE WORK
   - Install shower wall tile to ceiling
   - Install floor tile throughout
   - Build and tile shower niche
   - Grout and seal all tile

5. VANITY & COUNTERTOP
   - Install new vanity cabinet
   - Install countertop with undermount sink
   - Install mirror

6. SHOWER ENCLOSURE
   - Install frameless glass shower door
   - Install shower accessories (grab bar, shelf)

7. PAINT
   - Paint ceiling and any non-tiled walls
   - 2 coats over primer

8. ACCESSORIES
   - Install towel bars and toilet paper holder
   - Final caulking at all wet areas

EXCLUSIONS:
- Fixture purchases (by owner, unless specified)
- Structural repairs if rot discovered
- Permits (billed at cost if required)
`,

  deckBuild: `
SCOPE OF WORK - Deck Construction

1. PERMITS & PLANNING
   - Obtain all required building permits
   - Call 811 for utility locates
   - Survey and layout deck footprint

2. FOUNDATION
   - Excavate for concrete footings
   - Pour concrete pier footings per code
   - Allow proper cure time before loading

3. FRAMING
   - Install ledger board with proper flashing
   - Set posts with approved post-to-beam hardware
   - Install beams and joists at 16" O.C.
   - Install blocking for stability

4. DECKING
   - Install composite decking with proper gapping
   - Install fascia boards
   - Create picture frame border (if applicable)

5. RAILING
   - Install code-compliant railing system
   - Rails at 36" height (or 42" if required)
   - Balusters at max 4" spacing
   - Install post caps

6. STAIRS
   - Build stairs per code requirements
   - Install stair railing
   - Maximum 7-3/4" rise, minimum 10" run

7. ELECTRICAL (if included)
   - Install low-voltage deck lighting
   - Install exterior GFCI outlet

8. FINAL
   - Final inspection
   - Owner walk-through
   - Provide warranty information

EXCLUSIONS:
- Landscaping repairs
- Furniture or accessories
- Future maintenance
`,

  commercialTI: `
SCOPE OF WORK - Commercial Tenant Improvement

1. DEMOLITION
   - Selective demolition of existing partitions
   - Remove existing flooring as needed
   - Cap utilities at points of demo
   - Dispose of all debris

2. FRAMING
   - Metal stud framing for new partitions
   - Frame per approved construction documents
   - Install fire blocking as required

3. MECHANICAL, ELECTRICAL, PLUMBING
   - Extend/modify HVAC to new layout
   - Complete electrical rough-in per plan
   - Plumbing modifications as needed

4. DRYWALL
   - Hang drywall on all new partitions
   - Level 4 finish on all surfaces
   - Install sound insulation where specified

5. FLOORING
   - Install flooring per finish schedule
   - Coordinate with furniture installation
   - Install base trim throughout

6. CEILINGS
   - Install drop ceiling grid and tiles
   - Coordinate with MEP above ceiling

7. DOORS & HARDWARE
   - Install doors per schedule
   - Commercial-grade hardware
   - ADA compliant throughout

8. PAINT
   - Prime and paint all surfaces
   - Per approved color schedule

9. FIRE & LIFE SAFETY
   - Fire alarm modifications
   - Exit signage and emergency lighting

10. FINAL
    - Coordinate tenant move-in
    - Punch list completion
    - Certificate of occupancy

EXCLUSIONS:
- Furniture, fixtures, and equipment (FF&E)
- Voice/data cabling
- Security systems
- Signage (unless specified)
`,
};

// ============================================
// Labor Rate Constants
// ============================================

export const LABOR_RATE = 85; // $/hour standard labor rate

export const LABOR_RATES_BY_TRADE: Record<string, number> = {
  General: 75,
  Demolition: 65,
  Framing: 80,
  Electrical: 95,
  Plumbing: 95,
  HVAC: 90,
  Drywall: 70,
  Tile: 85,
  Flooring: 75,
  Paint: 65,
  Cabinets: 85,
  Countertops: 90,
  Roofing: 80,
  Exterior: 75,
  Concrete: 80,
  Millwork: 95,
};

// ============================================
// Helper to Calculate Line Item Total
// ============================================

export function calculateLineItemTotal(
  item: LineItemTemplate,
  laborRate: number = LABOR_RATE,
  markupPercent: number = 15
): { laborCost: number; materialsCost: number; markup: number; total: number } {
  const laborCost = item.laborHours * laborRate;
  const materialsCost = item.materialsCost;
  const subtotal = laborCost + materialsCost;
  const markup = subtotal * (markupPercent / 100);
  const total = subtotal + markup;

  return {
    laborCost: Math.round(laborCost * 100) / 100,
    materialsCost: Math.round(materialsCost * 100) / 100,
    markup: Math.round(markup * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
