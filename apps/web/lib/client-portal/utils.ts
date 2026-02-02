import type { PhaseProgress } from '@/types';

export const SELECTION_CATEGORIES = [
  'flooring',
  'countertops',
  'cabinets',
  'fixtures',
  'lighting',
  'paint',
  'tile',
  'appliances',
  'hardware',
  'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  countertops: 'Countertops',
  cabinets: 'Cabinets',
  fixtures: 'Fixtures',
  lighting: 'Lighting',
  paint: 'Paint Colors',
  tile: 'Tile',
  appliances: 'Appliances',
  hardware: 'Hardware',
  other: 'Other',
};

export const DOCUMENT_CATEGORIES = [
  'contract',
  'plans',
  'permits',
  'invoices',
  'change_orders',
  'warranty',
  'other',
] as const;

export function calculateOverallProgress(phases: PhaseProgress[]): number {
  if (!phases.length) return 0;
  const total = phases.reduce((sum, p) => sum + p.percent, 0);
  return Math.round(total / phases.length);
}

export function groupPhotosByDate<T extends { createdAt: Date }>(
  photos: T[]
): Record<string, T[]> {
  return photos.reduce((acc, photo) => {
    const date = new Date(photo.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, T[]>);
}

export function filterDocumentsForClient<T extends { category?: string }>(
  docs: T[]
): T[] {
  const clientCategories = ['contract', 'plans', 'invoices', 'change_orders', 'warranty'];
  return docs.filter(d => !d.category || clientCategories.includes(d.category));
}

export function formatProgress(percent: number): string {
  return `${Math.round(percent)}%`;
}
