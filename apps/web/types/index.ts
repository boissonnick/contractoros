import React from 'react';

export type UserRole = 'OWNER' | 'PM' | 'SUPER' | 'WORKER' | 'CLIENT' | 'SUB';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  orgId: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'planning';
  clientIds: string[];
  managerIds: string[];
}

export interface ScheduleItem {
  id: string;
  projectId: string;
  title: string;
  startDate: string;
  endDate: string;
  phase: string;
  assignedTo?: string[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}