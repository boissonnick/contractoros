/**
 * Photo Components
 *
 * A collection of components for the photo documentation system
 */

// Before/After comparison
export { default as BeforeAfterSlider, BeforeAfterSliderCompact } from './BeforeAfterSlider';

// Album components
export { default as PhotoAlbumCard, PhotoAlbumCardSkeleton, CreateAlbumCard } from './PhotoAlbumCard';

// Album management modal
export { default as CreateAlbumModal } from './CreateAlbumModal';

// Annotation tool
export { default as PhotoAnnotationTool } from './PhotoAnnotationTool';

// Lightbox viewer
export { default as PhotoLightbox } from './PhotoLightbox';

// Grid layout
export { default as PhotoGrid, PhotoGridSkeleton } from './PhotoGrid';

// Offline capture components
export { default as OfflinePhotoCapture } from './OfflinePhotoCapture';
export { default as PendingPhotosGrid } from './PendingPhotosGrid';

// Re-export types for convenience
export type { PhotoAlbumCardProps } from './PhotoAlbumCard';
export type { CreateAlbumModalProps } from './CreateAlbumModal';
export type { PhotoAnnotationToolProps } from './PhotoAnnotationTool';
export type { PhotoLightboxProps } from './PhotoLightbox';
export type { PhotoGridProps } from './PhotoGrid';
export type { BeforeAfterSliderProps } from './BeforeAfterSlider';
