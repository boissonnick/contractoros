/**
 * Seed Demo Documents
 *
 * Creates 18 document records across demo projects in the
 * organizations/{orgId}/documents collection.
 *
 * Document types: contracts, permits, insurance certificates,
 * lien waivers, plans/drawings, specifications, warranty docs
 *
 * Collection path: organizations/{orgId}/documents
 * Fields based on: apps/web/app/api/client/[token]/documents/route.ts
 *   and apps/web/lib/security/gdpr-export.ts
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  generateId,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  daysAgo,
  monthsAgo,
  randomInt,
  executeBatchWrites,
} from './utils';

const db = getDb();

// Demo projects with associated clients
const DEMO_PROJECTS = [
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    status: 'active',
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName,
    status: 'active',
  },
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    status: 'active',
  },
  {
    id: 'demo-proj-brown-kitchen',
    name: 'Brown Kitchen Remodel',
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    status: 'active',
  },
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    status: 'completed',
  },
];

const STORAGE_BASE = 'https://storage.googleapis.com/contractoros-demo/documents';

// Document definitions — each is hand-crafted for realism
const DOCUMENT_DEFINITIONS = [
  // ---- Thompson Deck Build ----
  {
    projectIndex: 0, // Thompson Deck
    name: 'Thompson Deck Build — Construction Contract',
    type: 'contract',
    description: 'Signed construction agreement for composite deck build, 400 sq ft with pergola.',
    fileName: 'Thompson_Deck_Contract_2025.pdf',
    fileSize: 245_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 45,
    uploadedByKey: 'owner' as const,
  },
  {
    projectIndex: 0,
    name: 'Building Permit — Deck Construction',
    type: 'permit',
    description: 'City of Aurora building permit #BP-2025-04821 for residential deck addition.',
    fileName: 'Aurora_Permit_BP-2025-04821.pdf',
    fileSize: 189_000,
    clientVisible: true,
    status: 'approved',
    daysAgoCreated: 40,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 0,
    name: 'Deck Plans — Structural Drawings',
    type: 'drawing',
    description: 'Engineered structural drawings for deck footings, framing, and railing details.',
    fileName: 'Thompson_Deck_Structural_Plans_v2.pdf',
    fileSize: 3_400_000,
    clientVisible: true,
    status: 'final',
    daysAgoCreated: 42,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 0,
    name: 'Trex Composite Decking — Warranty Certificate',
    type: 'warranty',
    description: '25-year limited warranty for Trex Transcend composite decking material.',
    fileName: 'Trex_Warranty_Certificate.pdf',
    fileSize: 120_000,
    clientVisible: true,
    status: 'active',
    daysAgoCreated: 10,
    uploadedByKey: 'pm' as const,
  },

  // ---- Office Park Suite 200 ----
  {
    projectIndex: 1, // Office Park
    name: 'Office Park Suite 200 — General Contract',
    type: 'contract',
    description: 'Commercial tenant improvement agreement for Office Park LLC, Suite 200 buildout.',
    fileName: 'OfficePark_Suite200_Contract.pdf',
    fileSize: 520_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 90,
    uploadedByKey: 'owner' as const,
  },
  {
    projectIndex: 1,
    name: 'General Liability Insurance Certificate',
    type: 'insurance',
    description: 'Certificate of insurance — $2M general liability, Horizon Construction Co.',
    fileName: 'Horizon_COI_GenLiability_2025.pdf',
    fileSize: 156_000,
    clientVisible: true,
    status: 'active',
    daysAgoCreated: 88,
    uploadedByKey: 'admin' as const,
  },
  {
    projectIndex: 1,
    name: 'Workers Compensation Certificate',
    type: 'insurance',
    description: 'Workers compensation insurance certificate, policy WC-2025-HCC.',
    fileName: 'Horizon_COI_WorkersComp_2025.pdf',
    fileSize: 142_000,
    clientVisible: true,
    status: 'active',
    daysAgoCreated: 88,
    uploadedByKey: 'admin' as const,
  },
  {
    projectIndex: 1,
    name: 'Commercial TI Permit — City of Englewood',
    type: 'permit',
    description: 'Tenant improvement permit #TI-2025-0312 for Suite 200 interior modifications.',
    fileName: 'Englewood_TI_Permit_0312.pdf',
    fileSize: 210_000,
    clientVisible: true,
    status: 'approved',
    daysAgoCreated: 80,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 1,
    name: 'Suite 200 — Floor Plan & Specifications',
    type: 'specification',
    description: 'Architectural floor plan with finish schedule, MEP notes, and ADA compliance details.',
    fileName: 'OfficePark_Suite200_FloorPlan_Specs.pdf',
    fileSize: 4_800_000,
    clientVisible: true,
    status: 'final',
    daysAgoCreated: 85,
    uploadedByKey: 'pm' as const,
  },

  // ---- Garcia Basement Finish ----
  {
    projectIndex: 2, // Garcia Basement
    name: 'Garcia Basement Finish — Construction Agreement',
    type: 'contract',
    description: 'Residential construction contract for basement finishing, 1,100 sq ft.',
    fileName: 'Garcia_Basement_Contract_2025.pdf',
    fileSize: 230_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 60,
    uploadedByKey: 'owner' as const,
  },
  {
    projectIndex: 2,
    name: 'Electrical Permit — Basement Wiring',
    type: 'permit',
    description: 'City of Lakewood electrical sub-permit for basement finish-out wiring.',
    fileName: 'Lakewood_Elec_Permit_E2025-0198.pdf',
    fileSize: 175_000,
    clientVisible: true,
    status: 'approved',
    daysAgoCreated: 52,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 2,
    name: 'Basement Layout — Design Drawings',
    type: 'drawing',
    description: 'Design drawings showing bedroom, bathroom, and living area layout with egress windows.',
    fileName: 'Garcia_Basement_Layout_Rev3.pdf',
    fileSize: 2_100_000,
    clientVisible: true,
    status: 'final',
    daysAgoCreated: 58,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 2,
    name: 'Conditional Lien Waiver — Framing Phase',
    type: 'lien_waiver',
    description: 'Conditional lien waiver upon progress payment for framing phase completion.',
    fileName: 'Garcia_ConditionalLienWaiver_Framing.pdf',
    fileSize: 98_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 20,
    uploadedByKey: 'admin' as const,
  },

  // ---- Brown Kitchen Remodel ----
  {
    projectIndex: 3, // Brown Kitchen
    name: 'Brown Kitchen Remodel — Construction Contract',
    type: 'contract',
    description: 'Residential kitchen remodel agreement including cabinets, countertops, and appliance installation.',
    fileName: 'Brown_Kitchen_Contract_2026.pdf',
    fileSize: 260_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 30,
    uploadedByKey: 'owner' as const,
  },
  {
    projectIndex: 3,
    name: 'Kitchen Design — Cabinet Layout & Elevations',
    type: 'drawing',
    description: 'Cabinet layout, elevation views, and appliance placement drawings.',
    fileName: 'Brown_Kitchen_CabinetLayout_v1.pdf',
    fileSize: 1_800_000,
    clientVisible: true,
    status: 'final',
    daysAgoCreated: 28,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 3,
    name: 'Countertop Specification — Quartz Selection',
    type: 'specification',
    description: 'Material specification sheet for Cambria Brittanicca quartz countertops.',
    fileName: 'Brown_Kitchen_Quartz_Spec.pdf',
    fileSize: 340_000,
    clientVisible: true,
    status: 'approved',
    daysAgoCreated: 22,
    uploadedByKey: 'pm' as const,
  },

  // ---- Smith Kitchen (Completed) ----
  {
    projectIndex: 4, // Smith Kitchen — completed project
    name: 'Smith Kitchen Remodel — Final Warranty Package',
    type: 'warranty',
    description: 'Combined warranty document covering cabinets (5 yr), countertops (15 yr), and appliances (1 yr).',
    fileName: 'Smith_Kitchen_WarrantyPackage_Final.pdf',
    fileSize: 410_000,
    clientVisible: true,
    status: 'active',
    daysAgoCreated: 120,
    uploadedByKey: 'pm' as const,
  },
  {
    projectIndex: 4,
    name: 'Unconditional Lien Waiver — Final Payment',
    type: 'lien_waiver',
    description: 'Unconditional lien waiver upon final payment for completed Smith kitchen project.',
    fileName: 'Smith_UnconditionalLienWaiver_Final.pdf',
    fileSize: 105_000,
    clientVisible: true,
    status: 'signed',
    daysAgoCreated: 115,
    uploadedByKey: 'admin' as const,
  },
];

async function seedDocuments(): Promise<number> {
  logSection('Seeding Demo Documents');

  const docsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('documents');

  const documents = DOCUMENT_DEFINITIONS.map((def) => {
    const project = DEMO_PROJECTS[def.projectIndex];
    const createdAt = daysAgo(def.daysAgoCreated);
    const uploader = DEMO_USERS[def.uploadedByKey];

    const docId = generateId('doc');
    const fileUrl = `${STORAGE_BASE}/${project.id}/${def.fileName}`;

    return {
      id: docId,
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      clientId: project.clientId,
      clientName: project.clientName,
      name: def.name,
      type: def.type,
      description: def.description,
      fileName: def.fileName,
      fileUrl,
      fileSize: def.fileSize,
      status: def.status,
      clientVisible: def.clientVisible,
      uploadedBy: uploader.uid,
      uploadedByName: uploader.displayName,
      createdAt,
      updatedAt: createdAt,
      isDemoData: true,
    };
  });

  await executeBatchWrites(
    db,
    documents,
    (batch, doc) => {
      const ref = docsRef.doc(doc.id);
      batch.set(ref, {
        ...doc,
        createdAt: toTimestamp(doc.createdAt),
        updatedAt: toTimestamp(doc.updatedAt),
      });
    },
    'Documents'
  );

  // Log summary by type
  const typeCounts: Record<string, number> = {};
  for (const doc of documents) {
    typeCounts[doc.type] = (typeCounts[doc.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(typeCounts)) {
    logProgress(`${type}: ${count} document(s)`);
  }

  logSuccess(`Created ${documents.length} documents across ${DEMO_PROJECTS.length} projects`);
  return documents.length;
}

// Run if executed directly
if (require.main === module) {
  seedDocuments()
    .then((count) => {
      console.log(`\nDone! Created ${count} documents.`);
      process.exit(0);
    })
    .catch((e) => {
      console.error('Error seeding documents:', e);
      process.exit(1);
    });
}

export { seedDocuments };
