import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface StatusService {
  id: string;
  name: string;
  description: string;
  current_status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  last_updated: string;
  group_id: string | null;
  is_monitored: boolean;
  api_endpoint?: string | null;
}

interface ServiceGroup {
  id: string;
  name: string;
  display_order: number;
}

const StatusPageSettings: React.FC = () => {
  const [services, setServices] = useState<StatusService[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'groups' | 'settings'>('services');
  
  // New service form state
  const [newService, setNewService] = useState<Omit<StatusService, 'id' | 'last_updated'>>({
    name: '',
    description: '',
    current_status: 'operational',
    group_id: null,
    is_monitored: false,
    api_endpoint: null
  });

  // New group form state
  const [newGroup, setNewGroup] = useState<Omit<ServiceGroup, 'id'>>({
    name: '',
    display_order: 0
  });

  // Edit states - will be used in future for inline editing functionality
  // const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  // const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Fetch services and groups on component mount
  useEffect(() => {
    fetchServicesAndGroups();
  }, []);

  const fetchServicesAndGroups = async () => {
    setIsLoading(true);
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No active session found');
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      
      const tenant_id = userData.tenant_id;
      
      // Fetch service groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('status_service_groups')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('display_order', { ascending: true });
      
      if (groupsError) {
        console.error('Error fetching service groups:', groupsError);
      } else if (groupsData) {
        setGroups(groupsData);
      }
      
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('status_services')
        .select('*')
        .eq('tenant_id', tenant_id);
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else if (servicesData) {
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error in fetchServicesAndGroups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new service
  const addService = async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be logged in to add a service');
      }
      
      // Get the current user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      const tenant_id = userData.tenant_id;
      
      // Add the new service
      const { data, error } = await supabase
        .from('status_services')
        .insert({
          tenant_id,
          name: newService.name,
          description: newService.description,
          current_status: newService.current_status,
          group_id: newService.group_id,
          is_monitored: newService.is_monitored,
          api_endpoint: newService.api_endpoint,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setServices([...services, data]);
      
      // Reset the form
      setNewService({
        name: '',
        description: '',
        current_status: 'operational',
        group_id: null,
        is_monitored: false,
        api_endpoint: null
      });
      
      alert('Service added successfully!');
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error adding service. Please try again.');
    }
  };

  // Add a new group
  const addGroup = async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be logged in to add a group');
      }
      
      // Get the current user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      const tenant_id = userData.tenant_id;
      
      // Add the new group
      const { data, error } = await supabase
        .from('status_service_groups')
        .insert({
          tenant_id,
          name: newGroup.name,
          display_order: groups.length // Set display_order to the current length of groups
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setGroups([...groups, data]);
      
      // Reset the form
      setNewGroup({
        name: '',
        display_order: 0
      });
      
      alert('Group added successfully!');
    } catch (error) {
      console.error('Error adding group:', error);
      alert('Error adding group. Please try again.');
    }
  };

  // Update service status
  const updateServiceStatus = async (serviceId: string, newStatus: 'operational' | 'degraded' | 'outage' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('status_services')
        .update({
          current_status: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, current_status: newStatus, last_updated: new Date().toISOString() } 
          : service
      ));
      
      // Add to status history
      await supabase
        .from('service_status_history')
        .insert({
          service_id: serviceId,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service status. Please try again.');
    }
  };

  // Delete a service
  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('status_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setServices(services.filter(service => service.id !== serviceId));
      
      alert('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please try again.');
    }
  };

  // Delete a group
  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All services in this group will be moved to "Ungrouped".')) {
      return;
    }
    
    try {
      // First update all services in this group to have no group
      const { error: updateError } = await supabase
        .from('status_services')
        .update({ group_id: null })
        .eq('group_id', groupId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Then delete the group
      const { error } = await supabase
        .from('status_service_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setGroups(groups.filter(group => group.id !== groupId));
      setServices(services.map(service => 
        service.group_id === groupId 
          ? { ...service, group_id: null } 
          : service
      ));
      
      alert('Group deleted successfully!');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group. Please try again.');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Status Page Settings</h1>
        <button 
          onClick={fetchServicesAndGroups}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'services'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'groups'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Page Settings
          </button>
        </nav>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Services Tab */}
      {!isLoading && activeTab === 'services' && (
        <div>
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Add New Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input 
                  type="text" 
                  value={newService.name} 
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Website, API, Database"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select 
                  value={newService.group_id || ''}
                  onChange={(e) => setNewService({...newService, group_id: e.target.value || null})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Ungrouped</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={newService.description} 
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Brief description of this service"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                <select 
                  value={newService.current_status}
                  onChange={(e) => setNewService({...newService, current_status: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="operational">Operational</option>
                  <option value="degraded">Degraded Performance</option>
                  <option value="outage">Major Outage</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Monitoring</label>
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="is_monitored"
                    checked={newService.is_monitored}
                    onChange={(e) => setNewService({...newService, is_monitored: e.target.checked})}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_monitored" className="ml-2 text-sm text-gray-700">
                    Enable API monitoring
                  </label>
                </div>
              </div>
            </div>
            {newService.is_monitored && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL</label>
                <input 
                  type="text" 
                  value={newService.api_endpoint || ''} 
                  onChange={(e) => setNewService({...newService, api_endpoint: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="https://api.example.com/status"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This endpoint should return a 2xx status code when the service is operational.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Note: Monitored services are checked approximately every 5 minutes. Status updates may take a few minutes to reflect.
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <button 
                onClick={addService}
                disabled={!newService.name}
                className={`px-4 py-2 rounded ${
                  !newService.name 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                Add Service
              </button>
            </div>
          </div>

          <h2 className="text-lg font-medium mb-4">Manage Services</h2>
          
          {services.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No services have been added yet. Add your first service above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monitoring
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map(service => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500">{service.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {service.group_id 
                            ? groups.find(g => g.id === service.group_id)?.name || 'Unknown Group' 
                            : 'Ungrouped'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(service.current_status)}`}></div>
                          <select 
                            value={service.current_status}
                            onChange={(e) => updateServiceStatus(service.id, e.target.value as any)}
                            className="text-sm text-gray-900 border-none bg-transparent focus:ring-0 cursor-pointer"
                          >
                            <option value="operational">Operational</option>
                            <option value="degraded">Degraded Performance</option>
                            <option value="outage">Major Outage</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(service.last_updated).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.is_monitored ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => deleteService(service.id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {!isLoading && activeTab === 'groups' && (
        <div>
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Add New Group</h2>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input 
                  type="text" 
                  value={newGroup.name} 
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Core Services, Third-party Services"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={addGroup}
                  disabled={!newGroup.name}
                  className={`px-4 py-2 rounded ${
                    !newGroup.name 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  Add Group
                </button>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-medium mb-4">Manage Groups</h2>
          
          {groups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No groups have been added yet. Add your first group above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Display Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map(group => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {services.filter(s => s.group_id === group.id).length} services
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group.display_order + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => deleteGroup(group.id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {!isLoading && activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Status Page Settings</h2>
          <p className="text-gray-500 mb-6">
            Configure how your status page appears to users. These settings control the display and behavior of the status page.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
              <input 
                type="text" 
                placeholder="System Status"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                placeholder="Current status of all our systems and services"
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refresh Interval (minutes)</label>
              <input 
                type="number" 
                min="1"
                max="60"
                defaultValue={5}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <p className="mt-1 text-xs text-gray-500">
                How often the status page should automatically refresh for users.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="show_uptime"
                    defaultChecked={true}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="show_uptime" className="ml-2 text-sm text-gray-700">
                    Show uptime percentage
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="show_history"
                    defaultChecked={true}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="show_history" className="ml-2 text-sm text-gray-700">
                    Show incident history
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="show_timestamps"
                    defaultChecked={true}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="show_timestamps" className="ml-2 text-sm text-gray-700">
                    Show last update timestamps
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPageSettings;
