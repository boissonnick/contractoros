/**
 * Seed Equipment for Demo Organization
 * Creates equipment inventory with checkout history and maintenance records
 *
 * Run: npx ts-node seed-equipment.ts
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
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

type EquipmentCategory = 'power_tool' | 'hand_tool' | 'heavy_equipment' | 'safety' | 'measuring' | 'vehicle' | 'other';
type EquipmentStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';

interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  serialNumber: string;
  description: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  currentLocation?: string;
  currentProjectId?: string;
  checkedOutTo?: string;
  checkedOutToName?: string;
  checkedOutAt?: Date;
  nextMaintenanceDate?: Date;
  qrCode?: string;
}

// Demo equipment inventory
const EQUIPMENT_INVENTORY: Omit<EquipmentItem, 'id' | 'qrCode'>[] = [
  // Power Tools
  {
    name: 'DeWalt 20V Circular Saw',
    category: 'power_tool',
    status: 'checked_out',
    serialNumber: 'DW-CS-2024-001',
    description: '7-1/4" cordless circular saw with 2 batteries',
    purchaseDate: monthsAgo(18),
    purchasePrice: 299,
    currentValue: 220,
    currentProjectId: 'demo-proj-thompson-deck',
    checkedOutTo: DEMO_USERS.fieldWorker1.uid,
    checkedOutToName: DEMO_USERS.fieldWorker1.displayName,
    checkedOutAt: daysAgo(5),
  },
  {
    name: 'Milwaukee M18 Drill/Driver',
    category: 'power_tool',
    status: 'available',
    serialNumber: 'MW-DD-2023-042',
    description: '1/2" brushless drill with 2 batteries and charger',
    purchaseDate: monthsAgo(24),
    purchasePrice: 249,
    currentValue: 150,
    currentLocation: 'Shop - Tool Wall A',
    nextMaintenanceDate: daysAgo(-30),
  },
  {
    name: 'DeWalt 12" Miter Saw',
    category: 'power_tool',
    status: 'checked_out',
    serialNumber: 'DW-MS-2022-015',
    description: 'Double bevel sliding compound miter saw with stand',
    purchaseDate: monthsAgo(30),
    purchasePrice: 599,
    currentValue: 400,
    currentProjectId: 'demo-proj-garcia-basement',
    checkedOutTo: DEMO_USERS.foreman.uid,
    checkedOutToName: DEMO_USERS.foreman.displayName,
    checkedOutAt: daysAgo(14),
  },
  {
    name: 'Makita Table Saw',
    category: 'power_tool',
    status: 'available',
    serialNumber: 'MK-TS-2023-008',
    description: '10" jobsite table saw with folding stand',
    purchaseDate: monthsAgo(12),
    purchasePrice: 749,
    currentValue: 600,
    currentLocation: 'Shop - Bay 2',
  },
  {
    name: 'Milwaukee M18 Impact Driver',
    category: 'power_tool',
    status: 'checked_out',
    serialNumber: 'MW-ID-2024-019',
    description: '1/4" hex impact driver, 2000 in-lbs torque',
    purchaseDate: monthsAgo(6),
    purchasePrice: 179,
    currentValue: 160,
    currentProjectId: 'demo-proj-thompson-deck',
    checkedOutTo: DEMO_USERS.fieldWorker2.uid,
    checkedOutToName: DEMO_USERS.fieldWorker2.displayName,
    checkedOutAt: daysAgo(3),
  },
  {
    name: 'Bosch Rotary Hammer',
    category: 'power_tool',
    status: 'maintenance',
    serialNumber: 'BO-RH-2022-003',
    description: '1-1/8" SDS-Plus rotary hammer - needs chuck replacement',
    purchaseDate: monthsAgo(36),
    purchasePrice: 399,
    currentValue: 200,
    currentLocation: 'Repair Shop',
  },
  {
    name: 'DeWalt Reciprocating Saw',
    category: 'power_tool',
    status: 'available',
    serialNumber: 'DW-RS-2023-027',
    description: '20V MAX cordless reciprocating saw',
    purchaseDate: monthsAgo(14),
    purchasePrice: 189,
    currentValue: 140,
    currentLocation: 'Shop - Tool Wall B',
  },
  {
    name: 'Festool Track Saw',
    category: 'power_tool',
    status: 'checked_out',
    serialNumber: 'FT-TS-2024-002',
    description: 'TS 55 REQ plunge cut saw with 55" track',
    purchaseDate: monthsAgo(8),
    purchasePrice: 675,
    currentValue: 580,
    currentProjectId: 'demo-proj-brown-kitchen',
    checkedOutTo: DEMO_USERS.fieldWorker2.uid,
    checkedOutToName: DEMO_USERS.fieldWorker2.displayName,
    checkedOutAt: daysAgo(7),
  },

  // Hand Tools
  {
    name: 'Stanley 25ft Tape Measure (Set of 5)',
    category: 'hand_tool',
    status: 'available',
    serialNumber: 'ST-TM-2024-SET1',
    description: '25ft PowerLock tape measures, set of 5',
    purchaseDate: monthsAgo(3),
    purchasePrice: 89,
    currentValue: 80,
    currentLocation: 'Shop - Hand Tool Drawer',
  },
  {
    name: 'Estwing Framing Hammer',
    category: 'hand_tool',
    status: 'checked_out',
    serialNumber: 'ES-FH-2023-012',
    description: '22oz steel framing hammer with leather grip',
    purchaseDate: monthsAgo(15),
    purchasePrice: 65,
    currentValue: 45,
    currentProjectId: 'demo-proj-thompson-deck',
    checkedOutTo: DEMO_USERS.fieldWorker1.uid,
    checkedOutToName: DEMO_USERS.fieldWorker1.displayName,
    checkedOutAt: daysAgo(14),
  },
  {
    name: 'Klein Electrician Tool Set',
    category: 'hand_tool',
    status: 'available',
    serialNumber: 'KL-ETS-2023-001',
    description: '28-piece electrician tool set with bag',
    purchaseDate: monthsAgo(20),
    purchasePrice: 299,
    currentValue: 220,
    currentLocation: 'Shop - Electrical Cabinet',
  },

  // Safety Equipment
  {
    name: 'Hard Hats (Set of 10)',
    category: 'safety',
    status: 'available',
    serialNumber: 'SH-HH-2024-001',
    description: 'OSHA compliant hard hats, assorted colors',
    purchaseDate: monthsAgo(6),
    purchasePrice: 150,
    currentValue: 140,
    currentLocation: 'Shop - Safety Rack',
  },
  {
    name: 'First Aid Kit - Job Site',
    category: 'safety',
    status: 'checked_out',
    serialNumber: 'FA-JK-2024-003',
    description: 'OSHA Class B first aid kit for job sites',
    purchaseDate: monthsAgo(4),
    purchasePrice: 175,
    currentValue: 160,
    currentProjectId: 'demo-proj-garcia-basement',
    checkedOutTo: DEMO_USERS.foreman.uid,
    checkedOutToName: DEMO_USERS.foreman.displayName,
    checkedOutAt: daysAgo(21),
  },
  {
    name: 'Fire Extinguisher Set',
    category: 'safety',
    status: 'checked_out',
    serialNumber: 'FE-SET-2023-007',
    description: 'Set of 3 ABC fire extinguishers',
    purchaseDate: monthsAgo(12),
    purchasePrice: 120,
    currentValue: 100,
    currentProjectId: 'demo-proj-office-park',
    checkedOutTo: DEMO_USERS.foreman.uid,
    checkedOutToName: DEMO_USERS.foreman.displayName,
    checkedOutAt: daysAgo(30),
  },

  // Measuring Equipment
  {
    name: 'Bosch Laser Level',
    category: 'measuring',
    status: 'checked_out',
    serialNumber: 'BO-LL-2023-004',
    description: 'Self-leveling cross-line laser with tripod',
    purchaseDate: monthsAgo(18),
    purchasePrice: 249,
    currentValue: 180,
    currentProjectId: 'demo-proj-garcia-basement',
    checkedOutTo: DEMO_USERS.fieldWorker3.uid,
    checkedOutToName: DEMO_USERS.fieldWorker3.displayName,
    checkedOutAt: daysAgo(10),
  },
  {
    name: 'Leica DISTO Laser Distance Meter',
    category: 'measuring',
    status: 'available',
    serialNumber: 'LC-DM-2024-001',
    description: 'D2 laser distance meter, 330ft range',
    purchaseDate: monthsAgo(5),
    purchasePrice: 149,
    currentValue: 135,
    currentLocation: 'Office - PM Desk',
  },
  {
    name: 'Johnson Level Transit',
    category: 'measuring',
    status: 'available',
    serialNumber: 'JL-TR-2022-002',
    description: '22X optical transit level with tripod',
    purchaseDate: monthsAgo(28),
    purchasePrice: 450,
    currentValue: 300,
    currentLocation: 'Shop - Survey Equipment',
  },

  // Heavy Equipment
  {
    name: 'Bobcat S70 Skid Steer',
    category: 'heavy_equipment',
    status: 'available',
    serialNumber: 'BC-SS-2021-001',
    description: 'Compact skid steer loader with bucket and forks',
    purchaseDate: monthsAgo(42),
    purchasePrice: 32500,
    currentValue: 24000,
    currentLocation: 'Shop - Equipment Yard',
    nextMaintenanceDate: daysAgo(-14),
  },
  {
    name: 'Vermeer Mini Excavator',
    category: 'heavy_equipment',
    status: 'checked_out',
    serialNumber: 'VM-ME-2022-003',
    description: 'CTX50 mini excavator with trailer',
    purchaseDate: monthsAgo(30),
    purchasePrice: 45000,
    currentValue: 38000,
    currentProjectId: 'demo-proj-thompson-deck',
    checkedOutTo: DEMO_USERS.fieldWorker1.uid,
    checkedOutToName: DEMO_USERS.fieldWorker1.displayName,
    checkedOutAt: daysAgo(14),
  },

  // Vehicles
  {
    name: 'Ford F-250 Work Truck',
    category: 'vehicle',
    status: 'checked_out',
    serialNumber: 'FORD-F250-2023',
    description: '2023 F-250 XL with lumber rack and toolbox',
    purchaseDate: monthsAgo(14),
    purchasePrice: 52000,
    currentValue: 45000,
    checkedOutTo: DEMO_USERS.foreman.uid,
    checkedOutToName: DEMO_USERS.foreman.displayName,
    checkedOutAt: monthsAgo(12),
  },
  {
    name: 'Enclosed Cargo Trailer',
    category: 'vehicle',
    status: 'available',
    serialNumber: 'TRL-ENC-2022-001',
    description: '6x12 enclosed cargo trailer',
    purchaseDate: monthsAgo(26),
    purchasePrice: 4500,
    currentValue: 3800,
    currentLocation: 'Shop - Trailer Parking',
  },

  // Retired Equipment
  {
    name: 'DeWalt 18V Drill (Old)',
    category: 'power_tool',
    status: 'retired',
    serialNumber: 'DW-DR-2018-001',
    description: 'Old 18V NiCad drill - batteries no longer available',
    purchaseDate: monthsAgo(72),
    purchasePrice: 199,
    currentValue: 0,
    currentLocation: 'Storage - Retired',
  },
];

// Sample checkout history entries
const CHECKOUT_HISTORY = [
  // Recent returns
  { equipmentName: 'Milwaukee M18 Drill/Driver', userName: DEMO_USERS.fieldWorker1.displayName, userId: DEMO_USERS.fieldWorker1.uid, projectId: 'demo-proj-smith-kitchen', checkedOutAt: daysAgo(280), returnedAt: daysAgo(240) },
  { equipmentName: 'DeWalt 12" Miter Saw', userName: DEMO_USERS.foreman.displayName, userId: DEMO_USERS.foreman.uid, projectId: 'demo-proj-smith-kitchen', checkedOutAt: daysAgo(275), returnedAt: daysAgo(245) },
  { equipmentName: 'Bosch Laser Level', userName: DEMO_USERS.fieldWorker2.displayName, userId: DEMO_USERS.fieldWorker2.uid, projectId: 'demo-proj-garcia-bath', checkedOutAt: daysAgo(95), returnedAt: daysAgo(60) },
  { equipmentName: 'Makita Table Saw', userName: DEMO_USERS.fieldWorker1.displayName, userId: DEMO_USERS.fieldWorker1.uid, projectId: 'demo-proj-mainst-retail', checkedOutAt: daysAgo(200), returnedAt: daysAgo(110) },
  { equipmentName: 'Klein Electrician Tool Set', userName: DEMO_USERS.fieldWorker3.displayName, userId: DEMO_USERS.fieldWorker3.uid, projectId: 'demo-proj-cafe-ti', checkedOutAt: daysAgo(70), returnedAt: daysAgo(30) },
  { equipmentName: 'Festool Track Saw', userName: DEMO_USERS.fieldWorker2.displayName, userId: DEMO_USERS.fieldWorker2.uid, projectId: 'demo-proj-garcia-bath', checkedOutAt: daysAgo(85), returnedAt: daysAgo(65) },
];

// Sample maintenance records
const MAINTENANCE_RECORDS = [
  { equipmentName: 'DeWalt 20V Circular Saw', type: 'preventive', description: 'Blade replacement and cleaning', date: daysAgo(60), cost: 35 },
  { equipmentName: 'Milwaukee M18 Drill/Driver', type: 'preventive', description: 'Battery calibration and chuck cleaning', date: daysAgo(45), cost: 0 },
  { equipmentName: 'Bobcat S70 Skid Steer', type: 'preventive', description: '500 hour service - oil, filters, grease', date: daysAgo(90), cost: 450 },
  { equipmentName: 'Bosch Rotary Hammer', type: 'repair', description: 'Chuck replacement in progress', date: daysAgo(5), cost: 180 },
  { equipmentName: 'Ford F-250 Work Truck', type: 'preventive', description: 'Oil change and tire rotation', date: daysAgo(30), cost: 120 },
  { equipmentName: 'Vermeer Mini Excavator', type: 'preventive', description: 'Hydraulic fluid change and track tension', date: daysAgo(75), cost: 350 },
  { equipmentName: 'DeWalt 12" Miter Saw', type: 'preventive', description: 'Blade alignment and fence calibration', date: daysAgo(120), cost: 0 },
];

async function seedEquipment() {
  const db = getDb();

  logSection('Seeding Equipment');

  const batch = db.batch();
  const equipmentRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('equipment');
  const checkoutsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('equipmentCheckouts');
  const maintenanceRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('maintenanceRecords');

  // Create equipment items
  const equipmentIds: Record<string, string> = {};

  for (const item of EQUIPMENT_INVENTORY) {
    const id = generateId('equip');
    equipmentIds[item.name] = id;

    const qrCode = `HCC-${item.serialNumber}`;

    const equipmentData = {
      id,
      orgId: DEMO_ORG_ID,
      name: item.name,
      category: item.category,
      status: item.status,
      serialNumber: item.serialNumber,
      description: item.description,
      purchaseDate: toTimestamp(item.purchaseDate),
      purchasePrice: item.purchasePrice,
      currentValue: item.currentValue,
      currentLocation: item.currentLocation || null,
      currentProjectId: item.currentProjectId || null,
      checkedOutTo: item.checkedOutTo || null,
      checkedOutToName: item.checkedOutToName || null,
      checkedOutAt: item.checkedOutAt ? toTimestamp(item.checkedOutAt) : null,
      nextMaintenanceDate: item.nextMaintenanceDate ? toTimestamp(item.nextMaintenanceDate) : null,
      qrCode,
      isDemoData: true,
      createdAt: toTimestamp(item.purchaseDate),
      updatedAt: toTimestamp(new Date()),
    };

    batch.set(equipmentRef.doc(id), equipmentData);
  }

  logProgress(`Created ${EQUIPMENT_INVENTORY.length} equipment items`);

  // Create checkout history
  for (const checkout of CHECKOUT_HISTORY) {
    const id = generateId('checkout');
    const equipmentId = equipmentIds[checkout.equipmentName] || generateId('equip');

    const checkoutData = {
      id,
      orgId: DEMO_ORG_ID,
      equipmentId,
      equipmentName: checkout.equipmentName,
      userId: checkout.userId,
      userName: checkout.userName,
      projectId: checkout.projectId,
      projectName: checkout.projectId.replace('demo-proj-', '').replace(/-/g, ' '),
      checkedOutAt: toTimestamp(checkout.checkedOutAt),
      expectedReturnDate: toTimestamp(new Date(checkout.checkedOutAt.getTime() + 14 * 24 * 60 * 60 * 1000)),
      returnedAt: checkout.returnedAt ? toTimestamp(checkout.returnedAt) : null,
      notes: '',
      isDemoData: true,
      createdAt: toTimestamp(checkout.checkedOutAt),
    };

    batch.set(checkoutsRef.doc(id), checkoutData);
  }

  logProgress(`Created ${CHECKOUT_HISTORY.length} checkout history records`);

  // Create maintenance records
  for (const record of MAINTENANCE_RECORDS) {
    const id = generateId('maint');
    const equipmentId = equipmentIds[record.equipmentName] || generateId('equip');

    const maintenanceData = {
      id,
      orgId: DEMO_ORG_ID,
      equipmentId,
      equipmentName: record.equipmentName,
      type: record.type,
      description: record.description,
      date: toTimestamp(record.date),
      cost: record.cost,
      performedBy: randomItem([DEMO_USERS.foreman.displayName, 'External Vendor']),
      status: record.date > daysAgo(7) ? 'in_progress' : 'completed',
      isDemoData: true,
      createdAt: toTimestamp(record.date),
      updatedAt: toTimestamp(new Date()),
    };

    batch.set(maintenanceRef.doc(id), maintenanceData);
  }

  logProgress(`Created ${MAINTENANCE_RECORDS.length} maintenance records`);

  await batch.commit();

  logSuccess(`Equipment seeding complete!`);
  console.log(`  - ${EQUIPMENT_INVENTORY.length} equipment items`);
  console.log(`  - ${CHECKOUT_HISTORY.length} checkout history records`);
  console.log(`  - ${MAINTENANCE_RECORDS.length} maintenance records`);
}

// Run if called directly
seedEquipment()
  .then(() => {
    console.log('\n✅ Equipment seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding equipment:', error);
    process.exit(1);
  });
