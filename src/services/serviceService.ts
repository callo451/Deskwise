import { supabase } from '../lib/supabase';

/**
 * Fetches all services
 */
export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetches a service by ID
 */
export const getServiceById = async (id: string) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates a new service
 */
export const createService = async (serviceData: {
  name: string;
  description?: string;
  owner_id?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  sla_id?: string;
}) => {
  const { data, error } = await supabase
    .from('services')
    .insert({
      ...serviceData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Updates a service
 */
export const updateService = async (
  id: string,
  serviceData: {
    name?: string;
    description?: string;
    owner_id?: string | null;
    status?: 'active' | 'inactive' | 'maintenance';
    sla_id?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from('services')
    .update({
      ...serviceData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Deletes a service
 */
export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Gets service statistics
 */
export const getServiceStats = async () => {
  // Get count of services by status
  const { data: statusData, error: statusError } = await supabase
    .from('services')
    .select('status, count')
    .group('status');

  if (statusError) {
    throw statusError;
  }

  // Get count of incidents by service
  const { data: incidentData, error: incidentError } = await supabase
    .from('tickets')
    .select('service_id, count')
    .eq('type', 'incident')
    .group('service_id');

  if (incidentError) {
    throw incidentError;
  }

  return {
    byStatus: statusData.reduce((acc, curr) => {
      acc[curr.status || 'unknown'] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    incidents: incidentData
  };
};
