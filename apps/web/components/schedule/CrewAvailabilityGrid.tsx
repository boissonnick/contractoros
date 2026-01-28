"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile, AvailabilityDefault, Availability } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CrewAvailabilityGridProps {
  teamMembers: Pick<UserProfile, 'uid' | 'displayName' | 'role'>[];
  orgId: string;
}

function getWeekDates(refDate: Date): Date[] {
  const start = new Date(refDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Start on Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function CrewAvailabilityGrid({ teamMembers, orgId }: CrewAvailabilityGridProps) {
  const [refDate, setRefDate] = useState(new Date());
  const [allDefaults, setAllDefaults] = useState<AvailabilityDefault[]>([]);
  const [allOverrides, setAllOverrides] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(refDate);
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (!orgId || teamMembers.length === 0) return;
    const uids = teamMembers.map(m => m.uid);

    Promise.all([
      getDocs(query(collection(db, 'availabilityDefaults'), where('orgId', '==', orgId))),
      getDocs(query(collection(db, 'availability'),
        where('userId', 'in', uids.slice(0, 10)),
        where('date', '>=', Timestamp.fromDate(weekDates[0])),
        where('date', '<=', Timestamp.fromDate(weekDates[6]))
      )),
    ]).then(([defSnap, overSnap]) => {
      setAllDefaults(defSnap.docs.map(d => ({ id: d.id, ...d.data() } as AvailabilityDefault)));
      setAllOverrides(overSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: (d.data().date as Timestamp).toDate(),
        createdAt: (d.data().createdAt as Timestamp).toDate(),
      } as Availability)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId, teamMembers, refDate]);

  const isAvailable = (userId: string, date: Date): boolean => {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const override = allOverrides.find(o => o.userId === userId && new Date(o.date.getFullYear(), o.date.getMonth(), o.date.getDate()).getTime() === dateStart.getTime());
    if (override) return override.isAvailable;
    const dayDefault = allDefaults.find(d => d.userId === userId && d.dayOfWeek === date.getDay());
    if (dayDefault) return dayDefault.isAvailable;
    return date.getDay() >= 1 && date.getDay() <= 5;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { const n = new Date(refDate); n.setDate(n.getDate() - 7); setRefDate(n); }} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="h-5 w-5" /></button>
        <h3 className="text-sm font-semibold text-gray-900">
          Week of {formatDate(weekDates[0], { month: 'short', day: 'numeric' })}
        </h3>
        <button onClick={() => { const n = new Date(refDate); n.setDate(n.getDate() + 7); setRefDate(n); }} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="h-5 w-5" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-40">Team Member</th>
                {weekDates.map((d, i) => (
                  <th key={i} className="text-center py-2 px-2 text-xs font-medium text-gray-500">
                    {DAY_LABELS[i]}<br />{d.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.uid} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-sm font-medium text-gray-900 truncate max-w-[160px]">{member.displayName}</td>
                  {weekDates.map((date, i) => {
                    const avail = isAvailable(member.uid, date);
                    return (
                      <td key={i} className="text-center py-2 px-2">
                        <div className={cn('w-6 h-6 rounded-full mx-auto', avail ? 'bg-green-400' : 'bg-gray-200')} title={avail ? 'Available' : 'Unavailable'} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
