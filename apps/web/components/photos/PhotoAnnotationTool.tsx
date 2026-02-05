"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PhotoAnnotation } from '@/types';
import { Button } from '@/components/ui';
import {
  ArrowUpRightIcon,
  CircleStackIcon,
  RectangleGroupIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type AnnotationType = 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';

interface Point {
  x: number;
  y: number;
}

export interface PhotoAnnotationToolProps {
  imageUrl: string;
  existingAnnotations?: PhotoAnnotation[];
  onSave: (annotations: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>[]) => void;
  onCancel: () => void;
  className?: string;
}

const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#FFFFFF', // white
];

/**
 * PhotoAnnotationTool - Canvas-based annotation tool for photos
 *
 * Features:
 * - Draw arrows, circles, rectangles, text, freehand
 * - Color picker
 * - Undo functionality
 * - Touch support for mobile
 */
export default function PhotoAnnotationTool({
  imageUrl,
  existingAnnotations = [],
  onSave,
  onCancel,
  className,
}: PhotoAnnotationToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<AnnotationType>('arrow');
  const [color, setColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [annotations, setAnnotations] = useState<Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        const aspectRatio = img.width / img.height;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight - 120; // Account for toolbar

        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        const context = canvasRef.current.getContext('2d');
        ctxRef.current = context;
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw arrow helper
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image scaled to canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    const allAnnotations = [...existingAnnotations.map(a => ({
      type: a.type,
      color: a.color,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      text: a.text,
      points: a.points,
    })), ...annotations];

    allAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const scaleX = canvas.width / image.width;
      const scaleY = canvas.height / image.height;

      switch (annotation.type) {
        case 'arrow':
          drawArrow(ctx, annotation.x * scaleX, annotation.y * scaleY,
            (annotation.x + (annotation.width || 0)) * scaleX,
            (annotation.y + (annotation.height || 0)) * scaleY);
          break;
        case 'circle':
          ctx.beginPath();
          const radius = Math.sqrt(Math.pow((annotation.width || 0) * scaleX, 2) + Math.pow((annotation.height || 0) * scaleY, 2));
          ctx.arc(annotation.x * scaleX, annotation.y * scaleY, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'rectangle':
          ctx.strokeRect(annotation.x * scaleX, annotation.y * scaleY,
            (annotation.width || 0) * scaleX, (annotation.height || 0) * scaleY);
          break;
        case 'text':
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = annotation.color;
          // Draw background
          const textMetrics = ctx.measureText(annotation.text || '');
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(annotation.x * scaleX - 4, annotation.y * scaleY - 16, textMetrics.width + 8, 24);
          ctx.fillStyle = annotation.color;
          ctx.fillText(annotation.text || '', annotation.x * scaleX, annotation.y * scaleY);
          break;
        case 'freehand':
          if (annotation.points && annotation.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x * scaleX, annotation.points[0].y * scaleY);
            annotation.points.forEach(p => ctx.lineTo(p.x * scaleX, p.y * scaleY));
            ctx.stroke();
          }
          break;
      }
    });
  }, [image, existingAnnotations, annotations]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get canvas coordinates from event
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Convert to image coordinates
    const scaleX = image.width / canvas.width;
    const scaleY = image.height / canvas.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasCoords(e);

    if (tool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);

    if (tool === 'freehand') {
      setCurrentPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = ctxRef.current;
    if (!isDrawing || !startPoint || !ctx || !canvasRef.current || !image) return;

    const point = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    // Redraw base
    redrawCanvas();

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    if (tool === 'freehand') {
      setCurrentPoints(prev => [...prev, point]);
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x * scaleX, currentPoints[0].y * scaleY);
      [...currentPoints, point].forEach(p => ctx.lineTo(p.x * scaleX, p.y * scaleY));
      ctx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(ctx, startPoint.x * scaleX, startPoint.y * scaleY, point.x * scaleX, point.y * scaleY);
    } else if (tool === 'circle') {
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow((point.x - startPoint.x) * scaleX, 2) + Math.pow((point.y - startPoint.y) * scaleY, 2));
      ctx.arc(startPoint.x * scaleX, startPoint.y * scaleY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      ctx.strokeRect(
        startPoint.x * scaleX,
        startPoint.y * scaleY,
        (point.x - startPoint.x) * scaleX,
        (point.y - startPoint.y) * scaleY
      );
    }
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const endPoint = getCanvasCoords(e);

    const newAnnotation: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'> = {
      type: tool,
      color,
      x: startPoint.x,
      y: startPoint.y,
      width: tool === 'freehand' ? 0 : endPoint.x - startPoint.x,
      height: tool === 'freehand' ? 0 : endPoint.y - startPoint.y,
      points: tool === 'freehand' ? [...currentPoints, endPoint] : undefined,
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handleTextSubmit = () => {
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      setTextInput('');
      return;
    }

    const newAnnotation: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'> = {
      type: 'text',
      color,
      x: textPosition.x,
      y: textPosition.y,
      text: textInput.trim(),
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setTextPosition(null);
    setTextInput('');
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  const handleSave = () => {
    onSave(annotations);
  };

  const tools: { type: AnnotationType; icon: React.ReactNode; label: string }[] = [
    { type: 'arrow', icon: <ArrowUpRightIcon className="h-5 w-5" />, label: 'Arrow' },
    { type: 'circle', icon: <CircleStackIcon className="h-5 w-5" />, label: 'Circle' },
    { type: 'rectangle', icon: <RectangleGroupIcon className="h-5 w-5" />, label: 'Rectangle' },
    { type: 'text', icon: <ChatBubbleLeftIcon className="h-5 w-5" />, label: 'Text' },
    { type: 'freehand', icon: <PencilIcon className="h-5 w-5" />, label: 'Draw' },
  ];

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-gray-900', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Tool buttons */}
          {tools.map(t => (
            <button
              key={t.type}
              onClick={() => setTool(t.type)}
              title={t.label}
              className={cn(
                'p-2 rounded-lg transition-colors',
                tool === t.type
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              {t.icon}
            </button>
          ))}

          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Color picker */}
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-transform',
                  color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Undo/Clear */}
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear all"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            <CheckIcon className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="max-w-full max-h-full cursor-crosshair rounded-lg shadow-lg"
        />
      </div>

      {/* Text input overlay */}
      {textPosition && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-xl">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              autoFocus
              className="w-64 px-3 py-2 border border-gray-300 rounded-lg mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setTextPosition(null); setTextInput(''); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleTextSubmit}>
                Add Text
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
