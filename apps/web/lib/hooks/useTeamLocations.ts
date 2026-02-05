"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { TeamMemberLocation, Vehicle, VehicleLocation, LocationHistoryEntry } from '@/types';

// ============================================
// Team Member Locations Hook
// ============================================

function fromFirestoreLocation(id: string, data: Record<string, unknown>): TeamMemberLocation {
  return {
    id,
    orgId: data.orgId as string,
    userId: data.userId as string,
    userName: data.userName as string || 'Unknown',
    userRole: data.userRole as TeamMemberLocation['userRole'],
    lat: data.lat as number,
    lng: data.lng as number,
    accuracy: data.accuracy as number | undefined,
    heading: data.heading as number | undefined,
    speed: data.speed as number | undefined,
    altitude: data.altitude as number | undefined,
    address: data.address as string | undefined,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    status: (data.status as TeamMemberLocation['status']) || 'offline',
    isClockingIn: (data.isClockingIn as boolean) || false,
    vehicleId: data.vehicleId as string | undefined,
    vehicleName: data.vehicleName as string | undefined,
    lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
}

export function useTeamLocations(orgId?: string) {
  const { profile } = useAuth();
  const targetOrgId = orgId || profile?.orgId;
  const [locations, setLocations] = useState<TeamMemberLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to team locations
  useEffect(() => {
    if (!targetOrgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `organizations/${targetOrgId}/teamLocations`),
      where('status', '!=', 'offline')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setLocations(snap.docs.map((d) => fromFirestoreLocation(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Team locations subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [targetOrgId]);

  // Update current user's location
  const updateMyLocation = useCallback(
    async (position: GeolocationPosition, options?: {
      projectId?: string;
      projectName?: string;
      isClockingIn?: boolean;
      vehicleId?: string;
      vehicleName?: string;
    }) => {
      if (!targetOrgId || !profile?.uid) return;

      const locationData: Partial<TeamMemberLocation> = {
        orgId: targetOrgId,
        userId: profile.uid,
        userName: profile.displayName || 'Unknown',
        userRole: profile.role,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        altitude: position.coords.altitude || undefined,
        status: 'active',
        isClockingIn: options?.isClockingIn ?? false,
        projectId: options?.projectId,
        projectName: options?.projectName,
        vehicleId: options?.vehicleId,
        vehicleName: options?.vehicleName,
        lastUpdated: new Date(),
      };

      try {
        // Try to update existing location doc
        const existingQuery = query(
          collection(db, `organizations/${targetOrgId}/teamLocations`),
          where('userId', '==', profile.uid)
        );
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
          // Update existing
          await updateDoc(
            doc(db, `organizations/${targetOrgId}/teamLocations`, existingSnap.docs[0].id),
            {
              ...locationData,
              lastUpdated: serverTimestamp(),
            }
          );
        } else {
          // Create new
          await addDoc(collection(db, `organizations/${targetOrgId}/teamLocations`), {
            ...locationData,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          });
        }

        // Also log to location history for tracking trail
        await addDoc(collection(db, `organizations/${targetOrgId}/locationHistory`), {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: serverTimestamp(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || null,
          heading: position.coords.heading || null,
          source: 'user',
          sourceId: profile.uid,
        });
      } catch (err) {
        console.error('Error updating location:', err);
        throw err;
      }
    },
    [targetOrgId, profile]
  );

  // Set user offline
  const setOffline = useCallback(async () => {
    if (!targetOrgId || !profile?.uid) return;

    try {
      const existingQuery = query(
        collection(db, `organizations/${targetOrgId}/teamLocations`),
        where('userId', '==', profile.uid)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        await updateDoc(
          doc(db, `organizations/${targetOrgId}/teamLocations`, existingSnap.docs[0].id),
          {
            status: 'offline',
            isClockingIn: false,
            lastUpdated: serverTimestamp(),
          }
        );
      }
    } catch (err) {
      console.error('Error setting offline:', err);
    }
  }, [targetOrgId, profile]);

  // Get location history for a user
  const getUserLocationHistory = useCallback(
    async (userId: string, startDate: Date, endDate: Date): Promise<LocationHistoryEntry[]> => {
      if (!targetOrgId) return [];

      try {
        const q = query(
          collection(db, `organizations/${targetOrgId}/locationHistory`),
          where('sourceId', '==', userId),
          where('source', '==', 'user'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate))
        );
        const snap = await getDocs(q);

        return snap.docs.map((d) => {
          const data = d.data();
          return {
            lat: data.lat,
            lng: data.lng,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            source: data.source,
            sourceId: data.sourceId,
          };
        });
      } catch (err) {
        console.error('Error fetching location history:', err);
        return [];
      }
    },
    [targetOrgId]
  );

  return {
    locations,
    loading,
    error,
    updateMyLocation,
    setOffline,
    getUserLocationHistory,
  };
}

// ============================================
// Vehicles Hook
// ============================================

function fromFirestoreVehicle(id: string, data: Record<string, unknown>): Vehicle {
  return {
    id,
    orgId: data.orgId as string,
    name: data.name as string,
    type: (data.type as Vehicle['type']) || 'other',
    licensePlate: data.licensePlate as string | undefined,
    make: data.make as string | undefined,
    model: data.model as string | undefined,
    year: data.year as number | undefined,
    vin: data.vin as string | undefined,
    color: data.color as string | undefined,
    assignedToUserId: data.assignedToUserId as string | undefined,
    assignedToUserName: data.assignedToUserName as string | undefined,
    hasGpsTracker: (data.hasGpsTracker as boolean) || false,
    trackerDeviceId: data.trackerDeviceId as string | undefined,
    lastServiceDate: data.lastServiceDate instanceof Timestamp ? data.lastServiceDate.toDate() : undefined,
    nextServiceDue: data.nextServiceDue instanceof Timestamp ? data.nextServiceDue.toDate() : undefined,
    odometerReading: data.odometerReading as number | undefined,
    status: (data.status as Vehicle['status']) || 'active',
    notes: data.notes as string | undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  };
}

function fromFirestoreVehicleLocation(id: string, data: Record<string, unknown>): VehicleLocation {
  return {
    id,
    orgId: data.orgId as string,
    vehicleId: data.vehicleId as string,
    name: data.name as string,
    type: (data.type as VehicleLocation['type']) || 'other',
    licensePlate: data.licensePlate as string | undefined,
    make: data.make as string | undefined,
    model: data.model as string | undefined,
    year: data.year as number | undefined,
    lat: data.lat as number,
    lng: data.lng as number,
    heading: data.heading as number | undefined,
    speed: data.speed as number | undefined,
    assignedToUserId: data.assignedToUserId as string | undefined,
    assignedToUserName: data.assignedToUserName as string | undefined,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    status: (data.status as VehicleLocation['status']) || 'offline',
    engineOn: data.engineOn as boolean | undefined,
    fuelLevel: data.fuelLevel as number | undefined,
    odometer: data.odometer as number | undefined,
    lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
}

export function useVehicles(orgId?: string) {
  const { profile } = useAuth();
  const targetOrgId = orgId || profile?.orgId;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to vehicles
  useEffect(() => {
    if (!targetOrgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `organizations/${targetOrgId}/vehicles`),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setVehicles(snap.docs.map((d) => fromFirestoreVehicle(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('Vehicles subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [targetOrgId]);

  // Subscribe to vehicle locations (for those with GPS trackers)
  useEffect(() => {
    if (!targetOrgId) return;

    const q = query(collection(db, `organizations/${targetOrgId}/vehicleLocations`));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setVehicleLocations(snap.docs.map((d) => fromFirestoreVehicleLocation(d.id, d.data())));
      },
      (err) => {
        console.error('Vehicle locations subscription error:', err);
      }
    );

    return unsub;
  }, [targetOrgId]);

  // CRUD operations
  const createVehicle = useCallback(
    async (data: Omit<Vehicle, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>) => {
      if (!targetOrgId) throw new Error('No organization');

      const docRef = await addDoc(collection(db, `organizations/${targetOrgId}/vehicles`), {
        ...data,
        orgId: targetOrgId,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    },
    [targetOrgId]
  );

  const updateVehicle = useCallback(
    async (id: string, data: Partial<Vehicle>) => {
      if (!targetOrgId) throw new Error('No organization');

      const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
      delete updateData.id;
      delete updateData.orgId;
      delete updateData.createdAt;

      await updateDoc(doc(db, `organizations/${targetOrgId}/vehicles`, id), updateData);
    },
    [targetOrgId]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      if (!targetOrgId) throw new Error('No organization');
      await deleteDoc(doc(db, `organizations/${targetOrgId}/vehicles`, id));
    },
    [targetOrgId]
  );

  // Assign vehicle to user
  const assignVehicle = useCallback(
    async (vehicleId: string, userId: string, userName: string) => {
      if (!targetOrgId) throw new Error('No organization');

      await updateDoc(doc(db, `organizations/${targetOrgId}/vehicles`, vehicleId), {
        assignedToUserId: userId,
        assignedToUserName: userName,
        updatedAt: serverTimestamp(),
      });
    },
    [targetOrgId]
  );

  // Unassign vehicle
  const unassignVehicle = useCallback(
    async (vehicleId: string) => {
      if (!targetOrgId) throw new Error('No organization');

      await updateDoc(doc(db, `organizations/${targetOrgId}/vehicles`, vehicleId), {
        assignedToUserId: null,
        assignedToUserName: null,
        updatedAt: serverTimestamp(),
      });
    },
    [targetOrgId]
  );

  // Update vehicle location (for GPS tracker integration)
  const updateVehicleLocation = useCallback(
    async (vehicleId: string, lat: number, lng: number, options?: {
      heading?: number;
      speed?: number;
      engineOn?: boolean;
      fuelLevel?: number;
      odometer?: number;
    }) => {
      if (!targetOrgId) throw new Error('No organization');

      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');

      const locationData = {
        orgId: targetOrgId,
        vehicleId,
        name: vehicle.name,
        type: vehicle.type,
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        lat,
        lng,
        heading: options?.heading,
        speed: options?.speed,
        assignedToUserId: vehicle.assignedToUserId,
        assignedToUserName: vehicle.assignedToUserName,
        status: (options?.speed && options.speed > 0 ? 'moving' : 'parked') as VehicleLocation['status'],
        engineOn: options?.engineOn,
        fuelLevel: options?.fuelLevel,
        odometer: options?.odometer,
        lastUpdated: serverTimestamp(),
      };

      // Upsert vehicle location
      const existingQuery = query(
        collection(db, `organizations/${targetOrgId}/vehicleLocations`),
        where('vehicleId', '==', vehicleId)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        await updateDoc(
          doc(db, `organizations/${targetOrgId}/vehicleLocations`, existingSnap.docs[0].id),
          locationData
        );
      } else {
        await addDoc(collection(db, `organizations/${targetOrgId}/vehicleLocations`), {
          ...locationData,
          createdAt: serverTimestamp(),
        });
      }

      // Log to location history
      await addDoc(collection(db, `organizations/${targetOrgId}/locationHistory`), {
        lat,
        lng,
        timestamp: serverTimestamp(),
        speed: options?.speed || null,
        heading: options?.heading || null,
        source: 'vehicle',
        sourceId: vehicleId,
      });
    },
    [targetOrgId, vehicles]
  );

  return {
    vehicles,
    vehicleLocations,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    assignVehicle,
    unassignVehicle,
    updateVehicleLocation,
  };
}

// ============================================
// Continuous Location Tracking Hook
// ============================================

export function useLocationTracking(options?: {
  enabled?: boolean;
  interval?: number; // ms, default 30000 (30 seconds)
  projectId?: string;
  projectName?: string;
}) {
  const { profile: _profile } = useAuth();
  const { updateMyLocation, setOffline } = useTeamLocations();
  const [tracking, setTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const interval = options?.interval ?? 30000;
  const enabled = options?.enabled ?? true;

  // Start tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported');
      return;
    }

    setTracking(true);
    setError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLastPosition(pos);
        updateMyLocation(pos, {
          projectId: options?.projectId,
          projectName: options?.projectName,
          isClockingIn: true,
        });
      },
      (err) => {
        setError(err.message);
        setTracking(false);
      },
      { enableHighAccuracy: true }
    );
  }, [updateMyLocation, options?.projectId, options?.projectName]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setTracking(false);
    setOffline();
  }, [setOffline]);

  // Periodic updates while tracking
  useEffect(() => {
    if (!tracking || !enabled) return;

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLastPosition(pos);
          updateMyLocation(pos, {
            projectId: options?.projectId,
            projectName: options?.projectName,
            isClockingIn: true,
          });
        },
        (err) => {
          console.error('Location update error:', err);
        },
        { enableHighAccuracy: true }
      );
    }, interval);

    return () => clearInterval(intervalId);
  }, [tracking, enabled, interval, updateMyLocation, options?.projectId, options?.projectName]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (tracking) {
        setOffline();
      }
    };
  }, [tracking, setOffline]);

  return {
    tracking,
    lastPosition,
    error,
    startTracking,
    stopTracking,
  };
}
