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
}

interface ServiceGroup {
  id: string;
  name: string;
  display_order: number;
}

interface StatusPageProps {
  primaryColor: string;
  secondaryColor: string; // Used for gradient effects in UI elements
}

const StatusPage: React.FC<StatusPageProps> = ({ primaryColor, secondaryColor }) => {
  // secondaryColor is used for gradient effects in various UI elements
  const [services, setServices] = useState<StatusService[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'outage' | 'maintenance'>('operational');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  // Default 5 minutes refresh interval
  const [refreshInterval] = useState(5 * 60 * 1000);

  useEffect(() => {
    fetchStatusData();
    
    // Set up auto-refresh
    const intervalId = setInterval(fetchStatusData, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchStatusData = async () => {
    setIsLoading(true);
    try {
      // Fetch service groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('status_service_groups')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (groupsError) {
        console.error('Error fetching service groups:', groupsError);
      } else if (groupsData) {
        setGroups(groupsData);
      }
      
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('status_services')
        .select('*');
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else if (servicesData) {
        setServices(servicesData);
        
        // Determine overall status
        let worstStatus = 'operational';
        let latestUpdate: string | null = null;
        
        servicesData.forEach(service => {
          // Update latest timestamp
          if (!latestUpdate || new Date(service.last_updated) > new Date(latestUpdate)) {
            latestUpdate = service.last_updated;
          }
          
          // Determine worst status
          if (service.current_status === 'outage') {
            worstStatus = 'outage';
          } else if (service.current_status === 'degraded' && worstStatus !== 'outage') {
            worstStatus = 'degraded';
          } else if (service.current_status === 'maintenance' && worstStatus !== 'outage' && worstStatus !== 'degraded') {
            worstStatus = 'maintenance';
          }
        });
        
        setOverallStatus(worstStatus as any);
        setLastUpdated(latestUpdate);
      }
    } catch (error) {
      console.error('Error in fetchStatusData:', error);
    } finally {
      setIsLoading(false);
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

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Major Outage';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  // Get overall status message
  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'operational':
        return 'All systems operational';
      case 'degraded':
        return 'Some systems experiencing degraded performance';
      case 'outage':
        return 'Some systems experiencing major outages';
      case 'maintenance':
        return 'Scheduled maintenance in progress';
      default:
        return 'System status unknown';
    }
  };

  // Group services by their group
  const getServicesByGroup = () => {
    const result: Record<string, StatusService[]> = {};
    
    // Initialize with empty arrays for each group
    groups.forEach(group => {
      result[group.id] = [];
    });
    
    // Add an "ungrouped" category
    result['ungrouped'] = [];
    
    // Populate groups with services
    services.forEach(service => {
      if (service.group_id && result[service.group_id]) {
        result[service.group_id].push(service);
      } else {
        result['ungrouped'].push(service);
      }
    });
    
    return result;
  };

  const servicesByGroup = getServicesByGroup();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Status Header */}
      <div className="mb-8 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full mb-4 ${getStatusColor(overallStatus)} bg-opacity-20`}>
          <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(overallStatus)}`}></div>
          <span className="text-sm font-medium" style={{ color: primaryColor }}>
            {getOverallStatusMessage()}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <p className="text-gray-600">
          Current status of all our systems and services
        </p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      )}

      {/* Status Dashboard */}
      {!isLoading && (
        <div className="space-y-8">
          {/* Grouped Services */}
          {groups.map(group => {
            const groupServices = servicesByGroup[group.id] || [];
            if (groupServices.length === 0) return null;
            
            return (
              <div key={group.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium" style={{ color: primaryColor }}>{group.name}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupServices.map(service => (
                    <div key={service.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(service.current_status)}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusText(service.current_status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Ungrouped Services */}
          {servicesByGroup['ungrouped'].length > 0 && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium" style={{ color: primaryColor }}>Other Services</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {servicesByGroup['ungrouped'].map(service => (
                  <div key={service.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(service.current_status)}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {getStatusText(service.current_status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* No Services Message */}
          {services.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No services have been added to the status page yet.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchStatusData}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default StatusPage;
