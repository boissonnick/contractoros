'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { useTeamLocations, useVehicles } from '@/lib/hooks/useTeamLocations';
import { TeamMemberLocation, VehicleLocation, VEHICLE_TYPES } from '@/types';
import {
  MapPinIcon,
  UserCircleIcon,
  TruckIcon,
  ClockIcon,
  SignalIcon,
  SignalSlashIcon,
  ChevronRightIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface TeamMapViewProps {
  showVehicles?: boolean;
  onMemberClick?: (member: TeamMemberLocation) => void;
  onVehicleClick?: (vehicle: VehicleLocation) => void;
  compact?: boolean;
}

export function TeamMapView({
  showVehicles = true,
  onMemberClick,
  onVehicleClick,
  compact = false,
}: TeamMapViewProps) {
  const { locations, loading: locationsLoading } = useTeamLocations();
  const { vehicleLocations, loading: vehiclesLoading } = useVehicles();

  const loading = locationsLoading || vehiclesLoading;

  // Filter active members and vehicles
  const activeMembers = locations.filter((l) => l.status !== 'offline');
  const activeVehicles = showVehicles ? vehicleLocations.filter((v) => v.status !== 'offline') : [];

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  if (activeMembers.length === 0 && activeVehicles.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<UsersIcon className="h-12 w-12" />}
          title="No Active Team Members"
          description="Team members will appear here when they clock in with location tracking enabled."
        />
      </Card>
    );
  }

  return (
    <Card className={compact ? 'p-3' : 'p-4'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Team Locations</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {activeMembers.length} online
          </span>
          {showVehicles && (
            <span className="flex items-center gap-1">
              <TruckIcon className="h-3 w-3" />
              {activeVehicles.length} vehicles
            </span>
          )}
        </div>
      </div>

      {/* Map placeholder - in production, this would integrate with Google Maps or Mapbox */}
      <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Map view requires Google Maps API key</p>
          <p className="text-xs text-gray-400 mt-1">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>

      {/* Team Member List */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team Members</h4>
        <div className="divide-y divide-gray-100">
          {activeMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => onMemberClick?.(member)}
              className={`flex items-center gap-3 py-3 ${onMemberClick ? 'cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''}`}
            >
              <div className="relative">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{member.userName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {member.projectName && (
                    <span className="truncate">{member.projectName}</span>
                  )}
                  {member.isClockingIn && (
                    <Badge size="sm" variant="success">Clocked In</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(member.lastUpdated, { addSuffix: true })}
                </p>
                {member.accuracy && (
                  <p className="text-xs text-gray-400">
                    {member.accuracy < 50 ? (
                      <span className="flex items-center justify-end gap-1">
                        <SignalIcon className="h-3 w-3 text-green-500" />
                        Good signal
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1">
                        <SignalSlashIcon className="h-3 w-3 text-yellow-500" />
                        Low accuracy
                      </span>
                    )}
                  </p>
                )}
              </div>
              {onMemberClick && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vehicles List */}
      {showVehicles && activeVehicles.length > 0 && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</h4>
          <div className="divide-y divide-gray-100">
            {activeVehicles.map((vehicle) => {
              const vehicleType = VEHICLE_TYPES.find((t) => t.value === vehicle.type);
              return (
                <div
                  key={vehicle.id}
                  onClick={() => onVehicleClick?.(vehicle)}
                  className={`flex items-center gap-3 py-3 ${onVehicleClick ? 'cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                      {vehicleType?.icon || '🚙'}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        vehicle.status === 'moving' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{vehicle.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {vehicle.licensePlate && <span>{vehicle.licensePlate}</span>}
                      {vehicle.assignedToUserName && (
                        <span className="truncate">• {vehicle.assignedToUserName}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge size="sm" variant={vehicle.status === 'moving' ? 'success' : 'default'}>
                      {vehicle.status === 'moving' ? 'Moving' : 'Parked'}
                    </Badge>
                    {vehicle.speed !== undefined && vehicle.speed > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(vehicle.speed * 2.237)} mph
                      </p>
                    )}
                  </div>
                  {onVehicleClick && (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export default TeamMapView;
