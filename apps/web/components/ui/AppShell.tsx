import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userDisplayName?: string;
  onSignOut: () => void;
}

export default function AppShell({ 
  children, 
  navItems, 
  userDisplayName, 
  onSignOut 
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-xl text-blue-900">ContractorOS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
              {userDisplayName ? userDisplayName.charAt(0) : 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate w-32">{userDisplayName}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile/Tablet Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <span className="font-bold text-lg text-blue-900">ContractorOS</span>
        <button onClick={onSignOut} className="text-sm text-gray-500">Sign Out</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 pb-safe">
        {navItems.slice(0, 5).map((item) => {
           const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
           return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] mt-1 truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}