"use client";

import React from 'react';
import Link from 'next/link';

// Mock data for Alpha
const projects = [
  { id: '1', name: 'Downtown Loft Reno', address: '123 Main St', status: 'active', client: 'Alice Smith' },
  { id: '2', name: 'Suburban Kitchen', address: '456 Oak Ave', status: 'planning', client: 'Bob Jones' },
  { id: '3', name: 'Commercial Office Fitout', address: '789 Business Pkwy', status: 'active', client: 'TechCorp' },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="block">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-gray-100 h-full">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                   }`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">#{project.id}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                <p className="mt-1 text-sm text-gray-500 truncate">{project.address}</p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="truncate">Client: {project.client}</span>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm text-blue-600 font-medium">View Dashboard &rarr;</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}