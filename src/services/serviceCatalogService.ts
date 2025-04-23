import { supabase } from '../lib/supabase';

export interface ServiceCatalogItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  icon: string | null;
  form_fields: any[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all service catalog items for the current tenant
 */
export const getServiceCatalogItems = async () => {
  const { data, error } = await supabase
    .from('service_catalog_items')
    .select(`
      *,
      category:ticket_categories(id, name)
    `)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Fetch a single service catalog item by ID
 * @param id The ID of the service catalog item
 */
export const getServiceCatalogItem = async (id: string) => {
  const { data, error } = await supabase
    .from('service_catalog_items')
    .select(`
      *,
      category:ticket_categories(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new service catalog item
 * @param item The service catalog item to create
 */
export const createServiceCatalogItem = async (item: Partial<ServiceCatalogItem>) => {
  const { data, error } = await supabase
    .from('service_catalog_items')
    .insert({
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing service catalog item
 * @param id The ID of the service catalog item to update
 * @param item The updated service catalog item data
 */
export const updateServiceCatalogItem = async (id: string, item: Partial<ServiceCatalogItem>) => {
  const { data, error } = await supabase
    .from('service_catalog_items')
    .update({
      ...item,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a service catalog item
 * @param id The ID of the service catalog item to delete
 */
export const deleteServiceCatalogItem = async (id: string) => {
  const { error } = await supabase
    .from('service_catalog_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Fetch active service catalog items for the self-service portal
 * @param categoryId Optional category ID to filter by
 */
export const getActiveServiceCatalogItems = async (categoryId?: string) => {
  let query = supabase
    .from('service_catalog_items')
    .select(`
      *,
      category:ticket_categories(id, name)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Fetch service catalog categories (active ticket categories)
 */
export const getServiceCatalogCategories = async () => {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a ticket from a service catalog item
 * @param serviceId The ID of the service catalog item
 * @param formData The form data submitted by the user
 * @param userId The ID of the user creating the ticket
 */
export const createTicketFromService = async (
  serviceId: string, 
  formData: any, 
  userId: string
) => {
  // First, get the service catalog item
  const service = await getServiceCatalogItem(serviceId);
  
  if (!service) {
    throw new Error('Service not found');
  }
  
  // Prepare ticket data
  const ticketData = {
    title: `${service.name} Request`,
    description: formData.description || '',
    status_id: await getDefaultStatusId(),
    priority_id: await getDefaultPriorityId(),
    category_id: service.category_id,
    service_id: service.id,
    created_by: userId,
    form_data: formData
  };
  
  // Create the ticket
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Helper functions to get default status and priority IDs
async function getDefaultStatusId() {
  const { data } = await supabase
    .from('ticket_statuses')
    .select('id')
    .eq('is_default', true)
    .single();
    
  return data?.id;
}

async function getDefaultPriorityId() {
  const { data } = await supabase
    .from('ticket_priorities')
    .select('id')
    .eq('is_default', true)
    .single();
    
  return data?.id;
}
