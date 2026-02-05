"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PageHeader } from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { FormModal } from '@/components/ui/FormModal';
import PhotoGrid, { PhotoGridSkeleton } from '@/components/photos/PhotoGrid';
import { ProjectPhoto } from '@/types';
import { cn } from '@/lib/utils';
import {
  processImage,
  getCurrentLocation,
  generatePhotoFilename,
  isValidImageFile,
} from '@/lib/photo-processing';
import { toast } from '@/components/ui/Toast';
import {
  CameraIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

// Convert Firestore data to ProjectPhoto
function photoFromFirestore(id: string, data: Record<string, unknown>): ProjectPhoto {
  return {
    id,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    phaseId: data.phaseId as string | undefined,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    url: data.url as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    type: data.type as ProjectPhoto['type'],
    caption: data.caption as string | undefined,
    tags: data.tags as string[] | undefined,
    approved: data.approved as boolean | undefined,
    location: data.location as ProjectPhoto['location'] | undefined,
    takenAt: data.takenAt ? (data.takenAt as Timestamp).toDate() : new Date(),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

// Photo type options
const PHOTO_TYPES: { value: ProjectPhoto['type']; label: string }[] = [
  { value: 'progress', label: 'Progress' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'issue', label: 'Issue' },
];

export default function SubPhotosPage() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProjectId, setUploadProjectId] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadType, setUploadType] = useState<ProjectPhoto['type']>('progress');
  const [captureLocation, setCaptureLocation] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects where the sub has accepted bids
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProjects = async () => {
      try {
        // Get accepted bids for this subcontractor
        const bidsQuery = query(
          collection(db, 'bids'),
          where('subId', '==', user.uid),
          where('status', '==', 'accepted')
        );
        const bidsSnap = await getDocs(bidsQuery);
        const projectIds = Array.from(new Set(bidsSnap.docs.map(d => d.data().projectId as string)));

        if (projectIds.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        // Fetch project details
        const projectsQuery = query(
          collection(db, 'projects'),
          where('__name__', 'in', projectIds.slice(0, 10)) // Firestore limits 'in' to 10
        );
        const projectsSnap = await getDocs(projectsQuery);
        const projectsData = projectsSnap.docs.map(d => ({
          id: d.id,
          name: (d.data().name as string) || 'Unnamed Project',
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user?.uid]);

  // Fetch photos uploaded by this subcontractor
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const constraints = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    // If a project is selected, filter by project
    if (selectedProject) {
      constraints.unshift(where('projectId', '==', selectedProject));
    }

    const photosQuery = query(collection(db, 'photos'), ...constraints);

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        const photosData = snapshot.docs.map(d => photoFromFirestore(d.id, d.data()));
        setPhotos(photosData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid, selectedProject]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => isValidImageFile(f));
    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }
    if (validFiles.length > 10) {
      toast.error('Maximum 10 photos per upload');
      return;
    }
    setUploadFiles(validFiles);
    setShowUploadModal(true);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Upload photos
  const handleUpload = useCallback(async () => {
    if (!user || !profile || uploadFiles.length === 0 || !uploadProjectId) {
      toast.error('Please select a project and photos to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get location if requested
      let location: { lat: number; lng: number } | null = null;
      if (captureLocation) {
        location = await getCurrentLocation();
      }

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress(Math.round(((i) / uploadFiles.length) * 100));

        // Process image (compress, generate thumbnail)
        const processed = await processImage(file);

        // Generate unique filename
        const filename = generatePhotoFilename(file.name);
        const basePath = `projects/${uploadProjectId}/photos`;

        // Upload main image
        const mainRef = ref(storage, `${basePath}/${filename}`);
        await uploadBytes(mainRef, processed.file);
        const url = await getDownloadURL(mainRef);

        // Upload thumbnail
        const thumbFilename = `thumb_${filename}`;
        const thumbRef = ref(storage, `${basePath}/thumbnails/${thumbFilename}`);
        await uploadBytes(thumbRef, processed.thumbnail);
        const thumbnailUrl = await getDownloadURL(thumbRef);

        // Create photo document
        const photoData = {
          projectId: uploadProjectId,
          userId: user.uid,
          userName: profile.displayName || profile.email || 'Subcontractor',
          url,
          thumbnailUrl,
          type: uploadType,
          caption: uploadCaption || null,
          tags: [],
          approved: false,
          location: location ? { lat: location.lat, lng: location.lng } : null,
          metadata: processed.metadata,
          takenAt: processed.metadata.takenAt
            ? Timestamp.fromDate(processed.metadata.takenAt)
            : Timestamp.now(),
          createdAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'photos'), photoData);
      }

      setUploadProgress(100);
      toast.success(`${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''} uploaded successfully`);

      // Reset and close modal
      setUploadFiles([]);
      setUploadCaption('');
      setUploadType('progress');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, profile, uploadFiles, uploadProjectId, uploadCaption, uploadType, captureLocation]);

  // Filtered photos based on selected project
  const displayPhotos = selectedProject
    ? photos.filter(p => p.projectId === selectedProject)
    : photos;

  // Stats
  const totalPhotos = photos.length;
  const approvedPhotos = photos.filter(p => p.approved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Photos"
        description="Document your work progress and completion"
        actions={
          <div className="flex items-center gap-2">
            {/* Camera capture button (mobile-friendly) */}
            <Button
              variant="outline"
              size="md"
              onClick={() => cameraInputRef.current?.click()}
              icon={<CameraIcon className="h-5 w-5" />}
              className="sm:hidden"
            >
              Camera
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              icon={<ArrowUpTrayIcon className="h-5 w-5" />}
            >
              Upload Photos
            </Button>
          </div>
        }
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileSelect(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileSelect(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{totalPhotos}</p>
          <p className="text-sm text-gray-500">Total Photos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">{approvedPhotos}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-sm text-gray-500">Active Projects</p>
        </div>
      </div>

      {/* Filter by project */}
      {projects.length > 0 && (
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 sm:flex-none sm:min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedProject && (
            <button
              onClick={() => setSelectedProject('')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone when no photos */}
      {!loading && displayPhotos.length === 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium font-heading tracking-tight text-gray-900 mb-1">No photos yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            {projects.length === 0
              ? 'Get assigned to projects to start uploading photos'
              : 'Drop photos here or click to upload'}
          </p>
          {projects.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                icon={<ArrowUpTrayIcon className="h-5 w-5" />}
              >
                Choose Files
              </Button>
              <Button
                variant="outline"
                className="sm:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                icon={<CameraIcon className="h-5 w-5" />}
              >
                Take Photo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && <PhotoGridSkeleton count={8} columns={4} />}

      {/* Photo grid */}
      {!loading && displayPhotos.length > 0 && (
        <PhotoGrid
          photos={displayPhotos}
          columns={4}
          gap="md"
          emptyMessage="No photos found for this project"
        />
      )}

      {/* Upload Modal */}
      <FormModal
        isOpen={showUploadModal}
        onClose={() => {
          if (!uploading) {
            setShowUploadModal(false);
            setUploadFiles([]);
          }
        }}
        title="Upload Photos"
        description={`${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''} selected`}
        submitLabel={uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
        loading={uploading}
        disabled={!uploadProjectId || uploadFiles.length === 0}
        onSubmit={handleUpload}
        size="lg"
      >
        {/* Preview thumbnails */}
        {uploadFiles.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
            {uploadFiles.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setUploadFiles(files => files.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Project selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={uploadProjectId}
              onChange={(e) => setUploadProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Photo type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PHOTO_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setUploadType(type.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    uploadType === type.value
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <textarea
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="Add a description of the work shown..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Location toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">Capture location</span>
            </div>
            <button
              type="button"
              onClick={() => setCaptureLocation(!captureLocation)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                captureLocation ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  captureLocation ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
