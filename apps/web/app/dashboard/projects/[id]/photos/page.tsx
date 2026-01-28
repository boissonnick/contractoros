"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectPhotos } from '@/lib/hooks/useProjectPhotos';
import { useAuth } from '@/lib/auth';
import { ProjectPhoto, ProjectPhase } from '@/types';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

type ViewMode = 'grid' | 'timeline';
type FilterPhase = string | 'all';

export default function ProjectPhotosPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  const { photos, loading, uploadPhoto, approvePhoto, deletePhoto, updatePhoto } = useProjectPhotos(projectId);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterPhase, setFilterPhase] = useState<FilterPhase>('all');
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPhaseId, setUploadPhaseId] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(collection(db, 'projects', projectId, 'phases')).then(snap => {
      setPhases(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
    });
  }, [projectId]);

  const filteredPhotos = photos.filter(p => {
    if (filterPhase !== 'all' && p.phaseId !== filterPhase) return false;
    if (filterApproved === 'approved' && !p.approved) return false;
    if (filterApproved === 'pending' && p.approved) return false;
    return true;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        await uploadPhoto(file, {
          phaseId: uploadPhaseId || undefined,
          caption: uploadCaption || undefined,
          type: 'progress',
        });
      }
    } finally {
      setUploading(false);
      setUploadCaption('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Group by date for timeline
  const photosByDate = filteredPhotos.reduce<Record<string, ProjectPhoto[]>>((acc, p) => {
    const key = formatDate(p.createdAt, { year: 'numeric', month: 'long', day: 'numeric' });
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
          <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('p-2 rounded-lg border border-gray-200', showFilters && 'bg-blue-50 border-blue-200')}
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-lg border border-gray-200', viewMode === 'grid' && 'bg-blue-50 border-blue-200')}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn('p-2 rounded-lg border border-gray-200', viewMode === 'timeline' && 'bg-blue-50 border-blue-200')}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload options */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Phase</label>
          <select
            value={uploadPhaseId}
            onChange={(e) => setUploadPhaseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">No phase</option>
            {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <Input
            value={uploadCaption}
            onChange={(e) => setUploadCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs text-gray-500">Phase</label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All phases</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value as 'all' | 'approved' | 'pending')}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredPhotos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption || 'Project photo'} className="w-full h-full object-cover" />
              {photo.approved && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
                  <CheckIcon className="h-3 w-3" />
                </div>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{photo.caption}</p>
                </div>
              )}
            </button>
          ))}
          {filteredPhotos.length === 0 && (
            <div className="col-span-full border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No photos yet. Upload your first photo above.</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {Object.entries(photosByDate).map(([date, datePhotos]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {datePhotos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredPhotos.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-sm text-gray-400">No photos to display.</p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Detail */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Photo'} className="w-full max-h-[60vh] object-contain bg-gray-900" />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {selectedPhoto.caption && (
                <p className="text-sm text-gray-900 font-medium">{selectedPhoto.caption}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>By: {selectedPhoto.userName || 'Unknown'}</span>
                <span>{formatDate(selectedPhoto.createdAt)}</span>
                {selectedPhoto.phaseId && (
                  <span>Phase: {phases.find(p => p.id === selectedPhoto.phaseId)?.name || selectedPhoto.phaseId}</span>
                )}
                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <span>Tags: {selectedPhoto.tags.join(', ')}</span>
                )}
                <span className={selectedPhoto.approved ? 'text-green-600' : 'text-yellow-600'}>
                  {selectedPhoto.approved ? 'Approved' : 'Pending approval'}
                </span>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t">
                  {!selectedPhoto.approved ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { approvePhoto(selectedPhoto.id, true); setSelectedPhoto({ ...selectedPhoto, approved: true }); }}
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { approvePhoto(selectedPhoto.id, false); setSelectedPhoto({ ...selectedPhoto, approved: false }); }}
                      icon={<XCircleIcon className="h-4 w-4" />}
                    >
                      Revoke Approval
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { deletePhoto(selectedPhoto.id); setSelectedPhoto(null); }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
