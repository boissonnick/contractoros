"use client";

import React from 'react';

export default function SubDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subcontractor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Schedule</h3>
            <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Downtown Loft - Phase 2 Electric</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Mon, Oct 24</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Suburban Kitchen - Rough-in</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">Wed, Oct 26</span>
                </div>
            </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
            <h3 className="text-lg font-medium text-gray-900">Open Punch Items</h3>
            <div className="mt-4 text-sm text-gray-500">
                You have <span className="font-bold text-red-600">3</span> items requiring attention.
            </div>
             <button className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50">
                View Punch List
            </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Work Orders</h3>
        </div>
        <ul className="divide-y divide-gray-200">
            <li className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">WO-2023-001</p>
                    <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                        </p>
                    </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                            Install lighting fixtures - Main Hall
                        </p>
                    </div>
                </div>
            </li>
        </ul>
      </div>
    </div>
  );
}