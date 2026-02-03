/**
 * Seed Photo Records for Demo Data
 *
 * Generates 80+ photo metadata records across all projects.
 * Uses placeholder URLs - no actual image uploads.
 *
 * Categories:
 * - Progress (most common)
 * - Before
 * - After
 * - Issue
 * - Inspection
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { PHOTO_CAPTIONS, MESSAGE_TOPICS } from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  generateId as genId,
} from './utils';
import { DEMO_PROJECTS, DEMO_DATA_PREFIX } from './seed-activities';

// All team members for photo attribution
const ALL_TEAM = [
  DEMO_USERS.owner,
  DEMO_USERS.pm,
  DEMO_USERS.foreman,
  DEMO_USERS.fieldWorker1,
  DEMO_USERS.fieldWorker2,
  DEMO_USERS.fieldWorker3,
];

// Types matching the ProjectPhoto interface
export type PhotoType = 'progress' | 'before' | 'after' | 'issue' | 'receipt' | 'inspection';

export interface ProjectPhotoSeed {
  id: string;
  projectId: string;
  orgId: string;
  taskId?: string;
  phaseId?: string;
  scopeItemId?: string;
  folderId?: string;
  albumId?: string;
  userId: string;
  userName?: string;
  url: string;
  thumbnailUrl?: string;
  type: PhotoType;
  caption?: string;
  tags?: string[];
  approved?: boolean;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  pairedPhotoId?: string;
  pairType?: 'before' | 'after';
  annotations?: Array<{
    id: string;
    type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';
    color: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    createdBy: string;
    createdAt: Date;
  }>;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    mimeType?: string;
    originalFilename?: string;
    capturedAt?: Date;
    deviceInfo?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

// Utility functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Placeholder image URLs (using placeholder services)
const PLACEHOLDER_BASE = 'https://placehold.co';
const IMAGE_DIMENSIONS = [
  { width: 1200, height: 900 },  // Landscape
  { width: 900, height: 1200 },  // Portrait
  { width: 1200, height: 1200 }, // Square
  { width: 1600, height: 900 },  // Wide
];

function generatePlaceholderUrl(type: PhotoType, index: number): string {
  const dim = randomElement(IMAGE_DIMENSIONS);
  const colors: Record<PhotoType, string> = {
    progress: '3b82f6/ffffff', // Blue
    before: '6b7280/ffffff',   // Gray
    after: '10b981/ffffff',    // Green
    issue: 'ef4444/ffffff',    // Red
    inspection: '8b5cf6/ffffff', // Purple
    receipt: 'f59e0b/ffffff',  // Amber
  };
  const color = colors[type] || '6b7280/ffffff';
  return `${PLACEHOLDER_BASE}/${dim.width}x${dim.height}/${color}?text=${type.replace('_', '+')}_${index}`;
}

function generateThumbnailUrl(type: PhotoType, index: number): string {
  const colors: Record<PhotoType, string> = {
    progress: '3b82f6/ffffff',
    before: '6b7280/ffffff',
    after: '10b981/ffffff',
    issue: 'ef4444/ffffff',
    inspection: '8b5cf6/ffffff',
    receipt: 'f59e0b/ffffff',
  };
  const color = colors[type] || '6b7280/ffffff';
  return `${PLACEHOLDER_BASE}/300x300/${color}?text=thumb_${index}`;
}

// Generate caption based on type
function generateCaption(type: PhotoType, phase: string, area: string): string {
  const templates = PHOTO_CAPTIONS[type as keyof typeof PHOTO_CAPTIONS] || PHOTO_CAPTIONS.progress;
  const template = randomElement(templates);

  return template
    .replace('{phase}', phase)
    .replace('{area}', area)
    .replace('{date}', new Date().toLocaleDateString())
    .replace('{work}', randomElement(MESSAGE_TOPICS.milestones))
    .replace('{milestone}', randomElement(MESSAGE_TOPICS.milestones))
    .replace('{task}', randomElement(['installation', 'framing', 'finishing', 'preparation']))
    .replace('{item}', randomElement(MESSAGE_TOPICS.materials))
    .replace('{issue}', randomElement(['water damage', 'alignment issue', 'material defect', 'code violation']))
    .replace('{inspection}', randomElement(MESSAGE_TOPICS.inspections));
}

// Generate metadata for a photo
function generateMetadata(date: Date): ProjectPhotoSeed['metadata'] {
  const dim = randomElement(IMAGE_DIMENSIONS);
  return {
    width: dim.width,
    height: dim.height,
    fileSize: randomInt(500000, 5000000), // 500KB - 5MB
    mimeType: 'image/jpeg',
    originalFilename: `IMG_${randomInt(1000, 9999)}.jpg`,
    capturedAt: date,
    deviceInfo: randomElement([
      'iPhone 14 Pro',
      'iPhone 15',
      'Samsung Galaxy S23',
      'Google Pixel 8',
      'Canon EOS R6',
    ]),
  };
}

// Generate location for outdoor projects
function generateLocation(project: typeof DEMO_PROJECTS[0]): ProjectPhotoSeed['location'] | undefined {
  // Only 30% of photos have location data
  if (Math.random() > 0.3) return undefined;

  // Base coordinates for Denver, CO area
  const baseLat = 39.7392 + (Math.random() - 0.5) * 0.1;
  const baseLng = -104.9903 + (Math.random() - 0.5) * 0.1;

  return {
    lat: baseLat,
    lng: baseLng,
    address: undefined, // Address not available in simplified project structure
  };
}

// Photo distribution by project type
const PHOTO_DISTRIBUTION: Record<string, Record<PhotoType, number>> = {
  kitchen: {
    progress: 12,
    before: 4,
    after: 3,
    issue: 2,
    inspection: 2,
    receipt: 0,
  },
  bathroom: {
    progress: 8,
    before: 3,
    after: 2,
    issue: 1,
    inspection: 2,
    receipt: 0,
  },
  commercial: {
    progress: 15,
    before: 5,
    after: 4,
    issue: 3,
    inspection: 4,
    receipt: 0,
  },
  deck: {
    progress: 6,
    before: 2,
    after: 2,
    issue: 1,
    inspection: 2,
    receipt: 0,
  },
  default: {
    progress: 8,
    before: 2,
    after: 2,
    issue: 1,
    inspection: 2,
    receipt: 0,
  },
};

// Get project type for distribution based on project name
function getProjectType(projectName: string): keyof typeof PHOTO_DISTRIBUTION {
  const name = projectName.toLowerCase();
  if (name.includes('office') || name.includes('retail') || name.includes('cafe')) return 'commercial';
  if (name.includes('deck') || name.includes('fence') || name.includes('pool')) return 'deck';
  if (name.includes('bath')) return 'bathroom';
  if (name.includes('kitchen')) return 'kitchen';
  return 'default';
}

// Main function to generate photos
export function generatePhotos(orgId: string): ProjectPhotoSeed[] {
  const photos: ProjectPhotoSeed[] = [];
  let photoIdCounter = 1;

  // Filter to projects that should have photos
  const projectsWithPhotos = DEMO_PROJECTS.filter(p =>
    p.status === 'active' || p.status === 'completed' || p.status === 'on_hold'
  );

  for (const project of projectsWithPhotos) {
    const projectType = getProjectType(project.name);
    const distribution = PHOTO_DISTRIBUTION[projectType];
    const phases = project.phases || [];

    // Base dates for the project
    const projectStart = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const projectEnd = project.status === 'completed' && project.endDate
      ? new Date(project.endDate)
      : new Date();
    const projectDuration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);

    // Scale distribution based on project status
    const scaleFactor = project.status === 'completed' ? 1 : 0.7;

    // Track before/after pairs
    const beforePhotos: ProjectPhotoSeed[] = [];

    // Generate photos by type
    for (const [typeStr, count] of Object.entries(distribution)) {
      const type = typeStr as PhotoType;
      const scaledCount = Math.ceil(count * scaleFactor);

      for (let i = 0; i < scaledCount; i++) {
        // Calculate photo date based on type
        let photoDate: Date;
        let phase: string;

        if (type === 'before') {
          // Before photos are from early in project
          photoDate = addDays(projectStart, randomInt(0, 3));
          phase = phases[0] || 'Pre-Construction';
        } else if (type === 'after') {
          // After photos are from end of project
          photoDate = project.status === 'completed'
            ? addDays(projectEnd, randomInt(-3, 0))
            : addDays(new Date(), randomInt(-7, 0));
          phase = phases[phases.length - 1] || 'Completion';
        } else if (type === 'inspection') {
          // Inspection photos at various milestones
          const dayOffset = Math.floor((i / scaledCount) * projectDuration);
          photoDate = addDays(projectStart, dayOffset);
          const phaseIndex = Math.min(
            Math.floor((dayOffset / projectDuration) * phases.length),
            phases.length - 1
          );
          phase = phases[phaseIndex] || 'Construction';
        } else {
          // Progress and issue photos spread throughout
          const dayOffset = Math.floor((i / scaledCount) * projectDuration * 0.9);
          photoDate = addDays(projectStart, dayOffset);
          const phaseIndex = Math.min(
            Math.floor((dayOffset / projectDuration) * phases.length),
            phases.length - 1
          );
          phase = phases[phaseIndex] || 'Construction';
        }

        const area = randomElement(MESSAGE_TOPICS.areas);
        const user = randomElement(ALL_TEAM);

        const photo: ProjectPhotoSeed = {
          id: `${DEMO_DATA_PREFIX}photo_${String(photoIdCounter++).padStart(4, '0')}`,
          projectId: project.id,
          orgId,
          phaseId: `${project.id}_phase_${phases.findIndex(p => p === phase) || 0}`,
          userId: user.uid,
          userName: user.displayName,
          url: generatePlaceholderUrl(type, photoIdCounter),
          thumbnailUrl: generateThumbnailUrl(type, photoIdCounter),
          type,
          caption: generateCaption(type, phase, area),
          tags: [
            phase.toLowerCase().replace(/\s+/g, '-'),
            type,
            area.toLowerCase().replace(/\s+/g, '-'),
          ],
          approved: type !== 'issue', // Issues need review
          location: generateLocation(project),
          metadata: generateMetadata(photoDate),
          createdAt: photoDate,
          updatedAt: photoDate,
        };

        // Handle before/after pairing
        if (type === 'before') {
          beforePhotos.push(photo);
        } else if (type === 'after' && beforePhotos.length > 0) {
          // Pair with a before photo
          const beforePhoto = beforePhotos.shift();
          if (beforePhoto) {
            photo.pairedPhotoId = beforePhoto.id;
            photo.pairType = 'after';
            beforePhoto.pairedPhotoId = photo.id;
            beforePhoto.pairType = 'before';
          }
        }

        // Add annotations for issue photos (30% chance)
        if (type === 'issue' && Math.random() > 0.7) {
          photo.annotations = [{
            id: generateId(),
            type: randomElement(['arrow', 'circle', 'rectangle']),
            color: '#ef4444',
            x: randomInt(20, 80),
            y: randomInt(20, 80),
            width: randomInt(10, 30),
            height: randomInt(10, 30),
            text: 'Issue area',
            createdBy: user.uid,
            createdAt: photoDate,
          }];
        }

        photos.push(photo);
      }
    }
  }

  // Sort by date descending
  photos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Log summary
  const byType: Record<string, number> = {};
  photos.forEach(p => {
    byType[p.type] = (byType[p.type] || 0) + 1;
  });

  console.log(`Generated ${photos.length} photos across ${projectsWithPhotos.length} projects:`);
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  return photos;
}

// Export for seeding
export { DEMO_DATA_PREFIX };

// Helper to remove undefined values recursively
function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
      result[key] = removeUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Conversion function for Firestore
export function convertToFirestore(photo: ProjectPhotoSeed): Record<string, unknown> {
  const data = {
    ...photo,
    createdAt: Timestamp.fromDate(photo.createdAt),
    updatedAt: photo.updatedAt ? Timestamp.fromDate(photo.updatedAt) : Timestamp.now(),
    metadata: photo.metadata
      ? {
          ...photo.metadata,
          capturedAt: photo.metadata.capturedAt
            ? Timestamp.fromDate(photo.metadata.capturedAt)
            : null,
        }
      : null,
    annotations: photo.annotations?.map(a => ({
      ...a,
      createdAt: Timestamp.fromDate(a.createdAt),
    })) || [],
  };
  return removeUndefined(data);
}

// ============================================
// Seed Photos to Firestore
// ============================================

async function seedPhotos(): Promise<void> {
  const admin = await import('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'contractoros-483812' });
  }

  const { getDb } = await import('./db');
  const { executeBatchWrites } = await import('./utils');
  const db = getDb();

  logSection('Seeding Photos');

  const photos = generatePhotos(DEMO_ORG_ID);

  logProgress(`Writing ${photos.length} photos to Firestore...`);

  await executeBatchWrites(
    db,
    photos,
    (batch, photo) => {
      // Photos stored in organizations/{orgId}/photos
      const ref = db
        .collection('organizations')
        .doc(DEMO_ORG_ID)
        .collection('photos')
        .doc(photo.id);
      batch.set(ref, convertToFirestore(photo));
    },
    'Photos'
  );

  logSuccess(`Seeded ${photos.length} photos`);
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedPhotos()
    .then(() => {
      console.log('\n✅ Photos seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding photos:', error);
      process.exit(1);
    });
}
