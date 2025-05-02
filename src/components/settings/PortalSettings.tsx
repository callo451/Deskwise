import React, { useState, useEffect, useRef } from 'react';
// Import removed as it's not used directly in this component
// import { getPortalSettings } from '../../services/portalSettingsService';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import ServiceCatalogSettings from './ServiceCatalogSettings';

// Define the PortalSettings interface to match the expected structure
interface PortalSettings {
  title: string;
  subtitle: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  banner_image_url: string | null;
  welcome_message: string | null;
}

// Portal Preview Component
const PortalPreview: React.FC<{
  settings: PortalSettings;
  sections: Array<{ id: string; name: string; visible: boolean; order: number }>;
}> = ({ settings, sections }) => {
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  return (
    <div className="preview-container overflow-auto" style={{ maxHeight: '600px' }}>
      {/* Only show sections that are visible */}
      {sortedSections.map(section => {
        if (!section.visible) return null;
        
        switch (section.id) {
          case 'hero':
            return (
              <div key={section.id} className="relative overflow-hidden min-h-[200px]">
                <div className="absolute inset-0 z-0">
                  {settings.banner_image_url ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <span>Banner Image</span>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full opacity-90"
                      style={{ background: `linear-gradient(to right, ${settings.primary_color}, ${settings.secondary_color})` }}
                    ></div>
                  )}
                </div>
                <div className="absolute inset-0 z-0 bg-black bg-opacity-30"></div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {settings.logo_url && (
                      <div className="h-12 w-12 bg-white rounded-full mb-4 flex items-center justify-center">
                        <span className="text-xs text-gray-500">Logo</span>
                      </div>
                    )}
                    <h1 className="text-2xl font-bold text-white mb-3">
                      {settings.title}
                    </h1>
                    <p className="text-sm text-white/90 max-w-2xl mx-auto">
                      {settings.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-white" style={{ 
                  clipPath: 'ellipse(75% 100% at 50% 100%)'
                }}></div>
              </div>
            );
            
          case 'search':
            return (
              <div key={section.id} className="max-w-lg mx-auto px-4 py-4 -mt-6 relative z-10">
                <div className="bg-white shadow-md rounded-full border border-gray-200 flex items-center p-1">
                  <div className="pl-3 pr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    className="flex-1 py-2 px-2 bg-transparent outline-none text-sm text-gray-600" 
                    placeholder="Search for services..." 
                    disabled
                  />
                </div>
              </div>
            );
            
          case 'quickActions':
            return (
              <div key={section.id} className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 -mt-2 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/70 border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center">
                      <div className="rounded-full p-3 mb-3" style={{ backgroundColor: settings.primary_color }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-1" style={{ color: settings.primary_color }}>Quick Action {i}</h3>
                      <p className="text-sm text-gray-500">Action description</p>
                    </div>
                  ))}
                </div>
              </div>
            );
            
          case 'serviceCatalog':
            return (
              <div key={section.id} className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-white/70 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold" style={{ color: settings.primary_color }}>Service Catalog</h2>
                    <p className="text-sm text-gray-500">Browse available services</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <h3 className="font-medium mb-2">Service {i}</h3>
                          <p className="text-sm text-gray-500 mb-3">Service description goes here</p>
                          <button 
                            className="text-sm px-3 py-1 rounded" 
                            style={{ 
                              backgroundColor: settings.primary_color,
                              color: 'white'
                            }}
                          >
                            Request
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );

          case 'statusPage':
            return (
              <div key={section.id} className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-white/70 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold" style={{ color: settings.primary_color }}>System Status</h2>
                    <p className="text-sm text-gray-500">Current status of all our systems and services</p>
                  </div>
                  
                  <div className="p-6">
                    {/* Status Page Preview */}
                    <div className="space-y-4">
                      {/* System Status Overview */}
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                          <span className="font-medium">All Systems Operational</span>
                        </div>
                        <span className="text-sm text-gray-500">Updated 5 minutes ago</span>
                      </div>
                      
                      {/* Individual Services */}
                      {['Ticketing System', 'Knowledge Base', 'User Portal', 'Email Notifications', 'API'].map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${index === 3 ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                            <span>{service}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {index === 3 ? 'Degraded Performance' : 'Operational'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
};

const PortalSettings: React.FC = () => {
  // State management for portal settings
  const [settings, setSettings] = useState({
    title: 'IT Service Portal',
    subtitle: 'Request services and track your tickets',
    logo_url: null as string | null,
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    banner_image_url: null as string | null,
    welcome_message: 'Welcome to the IT Service Portal. How can we help you today?'
  });

  // State for sections and their order
  const [sections, setSections] = useState([
    { id: 'hero', name: 'Hero Banner', visible: true, order: 0 },
    { id: 'search', name: 'Search Bar', visible: true, order: 1 },
    { id: 'quickActions', name: 'Quick Actions', visible: true, order: 2 },
    { id: 'serviceCatalog', name: 'Service Catalog', visible: true, order: 3 },
    { id: 'statusPage', name: 'System Status', visible: true, order: 4 }
  ]);
  
  // Removed duplicate activeTab state
  
  // Function to move a section up or down
  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections(prevSections => {
      const newSections = [...prevSections];
      const index = newSections.findIndex(section => section.id === id);
      
      if (direction === 'up' && index > 0) {
        // Swap with the section above
        [newSections[index].order, newSections[index - 1].order] = 
        [newSections[index - 1].order, newSections[index].order];
        [newSections[index], newSections[index - 1]] = 
        [newSections[index - 1], newSections[index]];
      } else if (direction === 'down' && index < newSections.length - 1) {
        // Swap with the section below
        [newSections[index].order, newSections[index + 1].order] = 
        [newSections[index + 1].order, newSections[index].order];
        [newSections[index], newSections[index + 1]] = 
        [newSections[index + 1], newSections[index]];
      }
      
      return newSections;
    });
  };
  
  // Drag and drop functionality - Use section IDs instead of indices
  const dragItemId = useRef<string | null>(null);
  const dragOverItemId = useRef<string | null>(null);
  
  const handleDragStart = (id: string) => {
    dragItemId.current = id;
  };
  
  const handleDragEnd = () => {
    if (dragItemId.current && dragOverItemId.current && dragItemId.current !== dragOverItemId.current) {
      setSections(prevSections => {
        const dragIndex = prevSections.findIndex(s => s.id === dragItemId.current);
        const dragOverIndex = prevSections.findIndex(s => s.id === dragOverItemId.current);

        // Ensure both items were found before modifying the array
        if (dragIndex === -1 || dragOverIndex === -1) {
            console.error("Drag Error: Could not find dragged or drag-over item by ID.");
            // Reset refs and return original state to prevent corruption
            dragItemId.current = null;
            dragOverItemId.current = null;
            return prevSections;
        }

        const newSections = [...prevSections];
        // Remove the dragged item using the found index
        const [draggedItem] = newSections.splice(dragIndex, 1);
        // Insert it at the found drag-over index
        newSections.splice(dragOverIndex, 0, draggedItem);

        // Update order properties based on the new array sequence
        return newSections.map((section, index) => ({
          ...section,
          order: index
        }));
      });
    }
    
    // Reset refs whether or not a valid drop occurred
    dragItemId.current = null;
    dragOverItemId.current = null;
  };
  
  // Toggle section visibility
  const toggleSectionVisibility = (id: string) => {
    setSections(prevSections => {
      return prevSections.map(section => 
        section.id === id ? { ...section, visible: !section.visible } : section
      );
    });
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState('layout'); // 'layout', 'theme', 'content', 'serviceCatalog'
  
  // Preview URL state
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch initial settings and section config
  useEffect(() => {
    const fetchSettingsAndConfig = async () => {
      try {
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('No active session found when fetching portal settings');
          return;
        }
        
        // Get the current user's tenant_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', session.user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }
        
        const tenant_id = userData.tenant_id;
        console.log('Fetching settings and config for tenant:', tenant_id);
        
        // Fetch settings for this tenant
        const { data: portalSettings, error: settingsError } = await supabase
          .from('portal_settings')
          .select('*')
          .eq('tenant_id', tenant_id)
          .maybeSingle();
        
        console.log('Fetched portal settings:', { portalSettings, settingsError });
        
        if (settingsError) {
          console.error('Error fetching portal settings:', settingsError);
          // Don't throw here, maybe sections can still load
        } else if (portalSettings) {
          // Ensure welcome_message is included (fixing type error)
          const completeSettings = {
            ...portalSettings,
            welcome_message: portalSettings.welcome_message || 'Welcome to the IT Service Portal. How can we help you today?'
          };
          console.log('Setting settings state with:', completeSettings);
          setSettings(completeSettings);
        }

        // Fetch section configuration for this tenant
        const { data: sectionConfig, error: configError } = await supabase
          .from('portal_section_config')
          .select('id, name, visible, order') // Select only necessary fields
          .eq('tenant_id', tenant_id);
          
        console.log('Fetched section config:', { sectionConfig, configError });

        if (configError) {
          console.error('Error fetching portal section config:', configError);
          // Keep default sections if config fails to load
        } else if (sectionConfig && sectionConfig.length > 0) {
          // Map fetched config to the state structure and sort by order
          const sortedConfig = sectionConfig.sort((a, b) => a.order - b.order);
          console.log('Setting sections state with fetched config:', sortedConfig);
          setSections(sortedConfig);
        } else {
          // No config found, use default (already set in initial state)
          console.log('No section config found for tenant, using default.');
        }
        
      } catch (error) {
        console.error('Error in fetchSettingsAndConfig:', error);
      }
    };
    
    fetchSettingsAndConfig();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      // First, get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be logged in to update portal settings');
      }
      
      // Get the current user's tenant_id and role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      const tenant_id = userData.tenant_id;
      const userRole = userData.role;
      console.log('User tenant_id:', tenant_id, 'User role:', userRole);
      
      // Check if user has permission
      if (userRole !== 'admin' && userRole !== 'manager') {
        throw new Error('Only admins and managers can update portal settings');
      }
      
      // Check if settings exist for this tenant
      const { data: existingSettings, error: settingsError } = await supabase
        .from('portal_settings')
        .select('id')
        .eq('tenant_id', tenant_id)
        .maybeSingle();
      
      console.log('Existing settings check:', { existingSettings, settingsError });
      
      if (settingsError) {
        console.error('Error checking existing settings:', settingsError);
        throw settingsError;
      }
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        console.log('Updating existing settings with ID:', existingSettings.id);
        const { data, error } = await supabase
          .from('portal_settings')
          .update({
            title: settings.title,
            subtitle: settings.subtitle,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            logo_url: settings.logo_url,
            banner_image_url: settings.banner_image_url,
            welcome_message: settings.welcome_message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id)
          .eq('tenant_id', tenant_id) // Ensure we're updating the correct tenant's settings
          .select()
          .single();
        
        if (error) {
          console.error('Error updating settings:', error);
          throw error;
        }
        
        result = data;
        console.log('Settings updated successfully:', result);
      } else {
        // Create new settings
        console.log('Creating new settings for tenant:', tenant_id);
        const { data, error } = await supabase
          .from('portal_settings')
          .insert({
            tenant_id: tenant_id,
            title: settings.title,
            subtitle: settings.subtitle,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            logo_url: settings.logo_url,
            banner_image_url: settings.banner_image_url,
            welcome_message: settings.welcome_message,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            footer_text: null,
            custom_css: null
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating settings:', error);
          throw error;
        }
        
        result = data;
        console.log('Settings created successfully:', result);
      }
      
      // Update local state with the result
      setSettings(result);
      
      // Save section configuration
      try {
        console.log('Saving section configuration for tenant:', tenant_id);
        
        // First, delete existing section configurations for this tenant
        const { error: deleteError } = await supabase
          .from('portal_section_config')
          .delete()
          .eq('tenant_id', tenant_id);
        
        if (deleteError) {
          console.error('Error deleting existing section config:', deleteError);
          throw deleteError;
        }
        
        // Then insert the new section configurations
        const sectionConfigData = sections.map(section => ({
          tenant_id: tenant_id,
          id: section.id,
          name: section.name,
          visible: section.visible,
          order: section.order
        }));
        
        const { error: insertError } = await supabase
          .from('portal_section_config')
          .insert(sectionConfigData);
        
        if (insertError) {
          console.error('Error inserting section config:', insertError);
          throw insertError;
        }
        
        console.log('Section configuration saved successfully');
      } catch (sectionError) {
        console.error('Error saving section configuration:', sectionError);
        // We'll still show a success message for the main settings, but log the section config error
      }
      
      // Show success notification
      alert('Portal settings saved successfully!');
    } catch (error) {
      console.error('Error saving portal settings:', error);
      // Show error notification
      alert('Error saving portal settings. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Self-Service Portal Builder</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setPreviewUrl(`${window.location.origin}/self-service-portal`);
              setShowPreviewModal(true);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          >
            Preview & Share
          </button>
          <button 
            onClick={saveSettings}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Preview & Share Portal</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Preview Your Portal</h3>
              <p className="text-gray-600 mb-3">See how your portal will appear to end users.</p>
              <div className="flex space-x-3">
                <Link 
                  to="/self-service-portal" 
                  target="_blank"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Open Preview
                </Link>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Share with Users</h3>
              <p className="text-gray-600 mb-3">Share this link with your users to access the self-service portal.</p>
              <div className="flex">
                <input 
                  type="text" 
                  value={previewUrl} 
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(previewUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-r-md hover:bg-gray-200 transition-colors border border-l-0 border-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Embed in Your Website</h3>
              <p className="text-gray-600 mb-3">Use this code to embed the portal in your website.</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  &lt;iframe src="{previewUrl}" width="100%" height="800" frameborder="0"&gt;&lt;/iframe&gt;
                </code>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="${previewUrl}" width="100%" height="800" frameborder="0"></iframe>`);
                  alert('Embed code copied to clipboard!');
                }}
                className="mt-2 px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Preview Area */}
        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[600px] overflow-auto">
          <div className="text-center text-gray-500 mb-4 p-2 bg-white rounded border border-gray-200">
            <span className="text-sm font-medium">Preview Area</span>
          </div>
          
          {/* macOS-like browser window */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Browser chrome/toolbar */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
              {/* Window controls */}
              <div className="flex items-center">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                {/* URL bar */}
                <div className="flex-1 bg-white rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-500 flex items-center">
                  <span className="mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <span>https://your-company.deskwise.io/self-service-portal</span>
                </div>
                
                {/* Browser actions */}
                <div className="ml-4 flex space-x-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
              
              {/* Browser tabs */}
              <div className="flex mt-2 text-xs">
                <div className="px-4 py-1 bg-white rounded-t-md border-t border-l border-r border-gray-300 text-gray-800 font-medium flex items-center">
                  <span>Self-Service Portal</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="px-4 py-1 text-gray-500">
                  +
                </div>
              </div>
            </div>
            
            {/* Browser content area */}
            <div className="browser-content">
              <PortalPreview settings={settings} sections={sections} />
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-80 border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['layout', 'theme', 'content', 'serviceCatalog'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'py-3 px-4 text-sm font-medium flex-1 text-center transition-colors',
                    activeTab === tab
                      ? 'bg-white text-primary border-b-2 border-primary'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  )}
                >
                  {tab === 'serviceCatalog' ? 'Service Catalog' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium mb-4">Portal Settings</h3>
          
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Arrange sections to customize your portal</p>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sections.map((section) => (
                  <div 
                    key={section.id}
                    className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md group hover:border-gray-300 cursor-move"
                    draggable
                    onDragStart={() => handleDragStart(section.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverItemId.current !== section.id) {
                        dragOverItemId.current = section.id;
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </span>
                        <span className="font-medium text-sm">{section.name}</span>
                        <span 
                          className={`ml-2 w-2 h-2 rounded-full ${section.visible ? 'bg-green-500' : 'bg-gray-300'}`}
                          title={section.visible ? 'Visible' : 'Hidden'}
                        ></span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleSectionVisibility(section.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title={section.visible ? 'Hide section' : 'Show section'}
                      >
                        {section.visible ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={sections.findIndex(s => s.id === section.id) === 0}
                        className={`p-1 ${sections.findIndex(s => s.id === section.id) === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={sections.findIndex(s => s.id === section.id) === sections.length - 1}
                        className={`p-1 ${sections.findIndex(s => s.id === section.id) === sections.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <input 
                  type="color" 
                  value={settings.primary_color} 
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="w-full h-10 p-1 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <input 
                  type="color" 
                  value={settings.secondary_color} 
                  onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                  className="w-full h-10 p-1 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input 
                  type="text" 
                  value={settings.logo_url || ''} 
                  onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                  placeholder="Enter logo URL"
                  className="w-full p-2 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                <input 
                  type="text" 
                  value={settings.banner_image_url || ''} 
                  onChange={(e) => setSettings({...settings, banner_image_url: e.target.value})}
                  placeholder="Enter banner image URL"
                  className="w-full p-2 rounded border border-gray-300"
                />
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal Title</label>
                <input 
                  type="text" 
                  value={settings.title} 
                  onChange={(e) => setSettings({...settings, title: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input 
                  type="text" 
                  value={settings.subtitle} 
                  onChange={(e) => setSettings({...settings, subtitle: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                <textarea 
                  value={settings.welcome_message || ''} 
                  onChange={(e) => setSettings({...settings, welcome_message: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 h-24"
                />
              </div>
            </div>
          )}
          
          {/* Service Catalog Tab */}
          {activeTab === 'serviceCatalog' && (
            <div className="overflow-hidden h-full">
              <ServiceCatalogSettings />
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSettings;