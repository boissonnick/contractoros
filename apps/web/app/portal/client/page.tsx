"use client";

import React from 'react';

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome Home</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Status</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Your project "Downtown Loft Reno" is currently in the <strong>Rough-in</strong> phase.</p>
            </div>
            <div className="mt-5">
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
               </div>
               <div className="mt-2 text-xs text-gray-500 text-right">45% Complete</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Updates</h3>
            <ul className="space-y-4">
                <li className="border-b pb-2">
                    <p className="text-sm font-medium text-gray-900">Electrical Rough-in Complete</p>
                    <p className="text-xs text-gray-500">Today at 10:00 AM</p>
                </li>
                <li className="border-b pb-2">
                    <p className="text-sm font-medium text-gray-900">Plumbing Inspection Passed</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                </li>
            </ul>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Change Order #03: Kitchen Tile Selection
                  </p>
                  <p className="mt-2 text-sm text-yellow-700">
                      <button className="font-medium underline hover:text-yellow-600">Review & Sign</button>
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}