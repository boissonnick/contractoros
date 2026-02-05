"use client";

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ProjectPhoto } from '@/types';
import { formatDate } from '@/lib/date-utils';

export interface BeforeAfterSliderProps {
  beforePhoto: ProjectPhoto;
  afterPhoto: ProjectPhoto;
  title?: string;
  className?: string;
  showLabels?: boolean;
  showDates?: boolean;
}

/**
 * BeforeAfterSlider - Interactive comparison slider for before/after photos
 *
 * Features:
 * - Drag or click to reveal before/after
 * - Touch support for mobile
 * - Optional labels and dates
 * - Keyboard accessible
 */
export default function BeforeAfterSlider({
  beforePhoto,
  afterPhoto,
  title,
  className,
  showLabels = true,
  showDates = true,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(100, prev + 5));
    }
  };

  // Attach global listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      )}

      <div
        ref={containerRef}
        className="relative aspect-video rounded-lg overflow-hidden cursor-col-resize select-none bg-gray-100"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after photo comparison slider"
      >
        {/* After photo (full width, behind) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterPhoto.url}
          alt={afterPhoto.caption || 'After photo'}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before photo (clipped by slider position) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforePhoto.url}
            alt={beforePhoto.caption || 'Before photo'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: '100%' }}
            draggable={false}
          />
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <>
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded">
              Before
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded">
              After
            </div>
          </>
        )}
      </div>

      {/* Dates */}
      {showDates && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatDate(beforePhoto.takenAt || beforePhoto.createdAt)}</span>
          <span>{formatDate(afterPhoto.takenAt || afterPhoto.createdAt)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * BeforeAfterSliderCompact - Smaller version for grid layouts
 */
export function BeforeAfterSliderCompact({
  beforePhoto,
  afterPhoto,
  onClick,
  className,
}: {
  beforePhoto: ProjectPhoto;
  afterPhoto: ProjectPhoto;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition group',
        className
      )}
    >
      {/* Split view preview */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 h-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforePhoto.thumbnailUrl || beforePhoto.url}
            alt="Before"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-1/2 h-full overflow-hidden border-l-2 border-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterPhoto.thumbnailUrl || afterPhoto.url}
            alt="After"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Overlay labels */}
      <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1/2 flex items-end justify-center pb-2">
          <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded">Before</span>
        </div>
        <div className="w-1/2 flex items-end justify-center pb-2">
          <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded">After</span>
        </div>
      </div>

      {/* Compare icon */}
      <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    </button>
  );
}
