import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SettingsLayout from '../components/settings/SettingsLayout';
import { useAuth } from '../contexts/AuthContext'; 

interface SettingsPageProps {
  activeTab?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth(); 

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
          // Redirect to portal settings with service catalog tab
          navigate('/settings/portal?tab=service-catalog');
          break;
        case 'status-page':
          // Stay on this page but show status page settings
          // This will be handled by the SettingsLayout component
          break;
        case 'workflow-automation':
          // Stay on this page but show workflow automation settings
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

  const handleDeleteTenant = async () => {
    const confirmation = window.confirm(
      'Are you absolutely sure you want to delete your account?\n\n' +
      'This action CANNOT be undone. This will permanently delete your entire tenant account and remove all associated data (users, tickets, service catalog, etc.).\n\n' +
      'Click OK to proceed with deletion.'
    );

    if (confirmation) {
      console.log("User confirmed deletion. Initiating tenant deletion process...");

      const currentSession = session; 
      const accessToken = currentSession?.access_token;

      if (!accessToken) {
        alert("Could not get access token. Are you logged in? Cannot proceed with deletion.");
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
        if (!supabaseUrl) {
          throw new Error("Supabase URL is not configured in environment variables.");
        }
        const functionUrl = `${supabaseUrl}/functions/v1/delete-tenant`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json' // Although no body is sent, it's good practice
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(`Failed to delete tenant: ${response.status} ${response.statusText} - ${errorData?.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Deletion result:', result);

        alert('Tenant deleted successfully! You will now be logged out.');
        
        // Use the signOut function from the useAuth hook
        try {
          await signOut();
          // Redirect to login or home page after logout
          console.log("User signed out, redirecting...");
          navigate('/login'); // Use navigate from react-router-dom
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
          alert('Tenant deleted, but failed to sign out automatically. Please sign out manually.');
        }

      } catch (error) {
        console.error('Error deleting tenant:', error);
        // Check if it's an Error object before accessing message
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Failed to initiate tenant deletion: ${errorMessage}`);
      }
    } else {
      console.log("User cancelled deletion.");
    }
  };

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <h2 className="text-lg font-medium text-gray-900 mb-2">Portal Settings</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure your self-service portal.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Customize portal appearance</li>
              <li>• Configure portal sections</li>
              <li>• Manage service catalog</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Status Page</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure your system status page.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Manage monitored services</li>
              <li>• Configure service groups</li>
              <li>• Set up status notifications</li>
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

        {/* Danger Zone - Delete Account Section */}
        <div className="mt-8 p-4 border border-red-500 rounded-md bg-red-50">
          <h2 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Deleting your account is permanent and cannot be undone. All your data, including users, tickets, and service catalog configurations, will be permanently removed.
          </p>
          <button
            onClick={handleDeleteTenant}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete Account
          </button>
        </div>
      </div>
    </SettingsLayout>
  </>
  );
};

export default SettingsPage;
