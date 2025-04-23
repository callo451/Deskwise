import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PortalSettings from './PortalSettings';
import ServiceCatalogSettings from './ServiceCatalogSettings';

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { userDetails } = useAuth();
  
  // Only admin and manager can access certain settings
  const isAdminOrManager = userDetails?.role === 'admin' || userDetails?.role === 'manager';
  
  const navigation = [
    { name: 'General', href: '/settings', adminOnly: false },
    { name: 'Profile', href: '/settings/profile', adminOnly: false },
    { name: 'Ticket Settings', href: '/settings/tickets', adminOnly: true },
    { name: 'Portal Settings', href: '/settings/portal', adminOnly: true },
    { name: 'Service Catalog', href: '/settings/service-catalog', adminOnly: true },
    { name: 'Users', href: '/settings/users', adminOnly: true },
    { name: 'Teams', href: '/settings/teams', adminOnly: true },
    { name: 'Integrations', href: '/settings/integrations', adminOnly: true },
  ];
  
  // Check if we're on the portal settings page
  const isPortalSettings = location.pathname === '/settings/portal';
  const isServiceCatalog = location.pathname === '/settings/service-catalog';

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page title moved to individual settings pages for consistency */}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {navigation.map((item) => {
              // Skip admin-only items for non-admin users
              if (item.adminOnly && !isAdminOrManager) return null;
              
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary border-l-4 border-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isPortalSettings ? (
            <PortalSettings />
          ) : isServiceCatalog ? (
            <ServiceCatalogSettings />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
