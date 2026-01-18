import React, { useState } from 'react';
import { Users, Clock, FileText, Shield, Building2, LogOut } from 'lucide-react';
import Employees from './Employees';
import BusinessDetails from './BusinessDetails';
import Timecard from './Timecard';
import PunchDetails from './PunchDetails';
import RolePermissions from './RolePermissions';

const Layout = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('employees');

  const menuItems = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'timecard', label: 'Timecard', icon: Clock },
    { id: 'punch-details', label: 'Punch Details', icon: FileText },
    { id: 'role-permissions', label: 'Role Permissions', icon: Shield },
    { id: 'business-details', label: 'Business Details', icon: Building2 },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'employees':
        return <Employees user={user} />;
      case 'business-details':
        return <BusinessDetails user={user} />;
      case 'timecard':
        return <Timecard user={user} />;
      case 'punch-details':
        return <PunchDetails user={user} />;
      case 'role-permissions':
        return <RolePermissions />;
      default:
        return <Employees user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel */}
      <div className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Employee Management</h1>
          <p className="text-gray-400 text-xs mt-1">System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeMenu === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                    : 'hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Layout;