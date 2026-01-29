"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { SignatureData, SignatureMethod } from '@/lib/esignature/types';
import {
  PencilIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SignaturePadProps {
  onSignatureChange: (data: SignatureData | null) => void;
  initialSignature?: SignatureData;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
];

export default function SignaturePad({
  onSignatureChange,
  initialSignature,
  width = 400,
  height = 150,
  className,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [method, setMethod] = useState<SignatureMethod>(initialSignature?.method || 'draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState(initialSignature?.typedName || '');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    initialSignature?.uploadedImageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear and set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw signature line
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    // Add "Sign here" text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Sign here', 20, height - 10);
  }, [width, height]);

  // Drawing functions
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || method !== 'draw') return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinates(e);

      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);

      setIsDrawing(true);
    },
    [disabled, method, getCoordinates]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled || method !== 'draw') return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinates(e);

      ctx.lineTo(x, y);
      ctx.stroke();
      setHasDrawn(true);
    },
    [isDrawing, disabled, method, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Export signature data
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange({
        method: 'draw',
        drawingData: dataUrl,
        width,
        height,
      });
    }
  }, [isDrawing, hasDrawn, onSignatureChange, width, height]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear and redraw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Redraw signature line
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    // Add "Sign here" text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Sign here', 20, height - 10);

    setHasDrawn(false);
    onSignatureChange(null);
  }, [width, height, onSignatureChange]);

  // Handle typed signature
  useEffect(() => {
    if (method === 'type' && typedName) {
      onSignatureChange({
        method: 'type',
        typedName,
        typedFont: selectedFont,
      });
    } else if (method === 'type') {
      onSignatureChange(null);
    }
  }, [method, typedName, selectedFont, onSignatureChange]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImage(dataUrl);
        onSignatureChange({
          method: 'upload',
          uploadedImageUrl: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    },
    [onSignatureChange]
  );

  // Method tabs
  const methods: { id: SignatureMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'draw', label: 'Draw', icon: <PencilIcon className="h-4 w-4" /> },
    { id: 'type', label: 'Type', icon: <DocumentTextIcon className="h-4 w-4" /> },
    { id: 'upload', label: 'Upload', icon: <ArrowUpTrayIcon className="h-4 w-4" /> },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Method tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMethod(m.id);
              if (m.id === 'draw') clearCanvas();
            }}
            disabled={disabled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              method === m.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Signature area */}
      <div className="relative">
        {/* Draw method */}
        {method === 'draw' && (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={cn(
                'border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair touch-none',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ width: '100%', height: height }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {hasDrawn && (
              <button
                onClick={clearCanvas}
                disabled={disabled}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Clear signature"
              >
                <ArrowPathIcon className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        )}

        {/* Type method */}
        {method === 'type' && (
          <div className="space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              disabled={disabled}
              className={cn(
                'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            />
            {typedName && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center"
                style={{ minHeight: height }}
              >
                <span
                  className="text-3xl text-gray-900"
                  style={{ fontFamily: `"${selectedFont}", cursive` }}
                >
                  {typedName}
                </span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font.name)}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md border transition-colors',
                    selectedFont === font.name
                      ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ fontFamily: `"${font.name}", ${font.style}` }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload method */}
        {method === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadedImage ? (
              <div className="relative">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center bg-white"
                  style={{ minHeight: height }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-full max-w-full object-contain"
                    style={{ maxHeight: height - 40 }}
                  />
                </div>
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    onSignatureChange(null);
                  }}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  title="Remove image"
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={cn(
                  'w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-gray-400 transition-colors',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ minHeight: height }}
              >
                <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload your signature image
                </span>
                <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        {method === 'draw' && 'Draw your signature above using your mouse or finger'}
        {method === 'type' && 'Type your full legal name and select a font style'}
        {method === 'upload' && 'Upload an image of your signature'}
      </p>
    </div>
  );
}
