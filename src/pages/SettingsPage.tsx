import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SettingsLayout from '../components/settings/SettingsLayout';

interface SettingsPageProps {
  activeTab?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to specific settings page if activeTab is provided
    if (activeTab) {
      switch (activeTab) {
        case 'tickets':
          navigate('/settings/tickets');
          break;
        case 'portal':
          // Stay on this page but show portal settings
          // This will be handled by the SettingsLayout component
          break;
        case 'service-catalog':
          // Stay on this page but show service catalog settings
          // This will be handled by the SettingsLayout component
          break;
        case 'users':
          navigate('/settings/users');
          break;
        case 'profile':
          navigate('/settings/profile');
          break;
        default:
          break;
      }
    }
  }, [activeTab, navigate]);
  return (
    <>
      <Helmet>
        <title>Settings | DeskWise ITSM</title>
      </Helmet>
      
      <SettingsLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">General Settings</h1>
          <p className="text-gray-600 mb-6">Configure your DeskWise ITSM instance</p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Use the sidebar to navigate to specific settings sections.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Tenant Information</h2>
            <p className="text-sm text-gray-500 mb-4">
              View and manage your tenant details.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Update tenant name and contact information</li>
              <li>• Manage tenant branding and appearance</li>
              <li>• Configure tenant-wide settings</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">User Management</h2>
            <p className="text-sm text-gray-500 mb-4">
              Manage users and permissions.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Invite new users to your tenant</li>
              <li>• Assign roles and permissions</li>
              <li>• Manage user access</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Ticket Settings</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure ticket management settings.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Manage ticket priorities</li>
              <li>• Configure ticket categories</li>
              <li>• Set up SLAs and automation rules</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Integrations</h2>
            <p className="text-sm text-gray-500 mb-4">
              Connect with other tools and services.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Email integration</li>
              <li>• Third-party service connections</li>
              <li>• API access and webhooks</li>
            </ul>
          </div>
        </div>
      </div>
    </SettingsLayout>
    </>
  );
};

export default SettingsPage;
