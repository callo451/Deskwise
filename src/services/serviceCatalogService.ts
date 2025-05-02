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

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all service catalog items for the current tenant
 */
export const getServiceCatalogItems = async () => {
  console.log('Fetching service catalog items...');
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User data:', userData);
    
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', userData.user.id)
      .single();
    
    console.log('User details:', userDetails);
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    console.log('Using tenant_id for fetch:', tenant_id);
    
    // Use our custom RPC function to bypass RLS for fetching items
    const { data, error } = await supabase.rpc('get_service_catalog_items', {
      tenant_id_param: tenant_id
    });
    
    console.log('Fetch result:', { data, error });

    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    console.log('Fetched items count:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getServiceCatalogItems:', error);
    throw error;
  }
};

/**
 * Fetch a single service catalog item by ID
 * @param id The ID of the service catalog item
 */
export const getServiceCatalogItem = async (id: string) => {
  console.log('Fetching service catalog item with ID:', id);
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User data:', userData);
    
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userData.user?.id)
      .single();
    
    console.log('User details:', userDetails);
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    console.log('Using tenant_id for fetch:', tenant_id);
    
    // Use our custom RPC function to bypass RLS for fetching the item
    const { data, error } = await supabase.rpc('get_service_catalog_item', {
      item_id_param: id,
      tenant_id_param: tenant_id
    });
    
    console.log('Fetch result:', { data, error });

    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Service catalog item not found with ID: ${id}`);
    }
    
    console.log('Fetched service catalog item:', data);
    return data;
  } catch (error) {
    console.error('Error in getServiceCatalogItem:', error);
    throw error;
  }
};

/**
 * Create a new service catalog item
 * @param item The service catalog item to create
 */
export const createServiceCatalogItem = async (item: Partial<ServiceCatalogItem>) => {
  console.log('Creating service catalog item:', item);
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User data:', userData);
    
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    
    if (!userData?.user) {
      console.error('No user found');
      throw new Error('User is not authenticated');
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', userData.user.id)
      .single();
    
    console.log('User details:', userDetails);
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    // Check if user has admin or manager role
    console.log('User role:', userDetails.role);
    if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
      console.error('User does not have required role');
      throw new Error('You must be an admin or manager to create service catalog items');
    }
    
    const tenant_id = userDetails.tenant_id;
    console.log('Tenant ID:', tenant_id);
    
    // Prepare item data
    const itemData = {
      ...item,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Item data for RPC:', itemData);
    
    // Use RPC call to bypass RLS
    const { data, error } = await supabase.rpc('create_service_catalog_item', {
      item_data: itemData
    });
    
    console.log('RPC response:', { data, error });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }
    
    console.log('Service catalog item created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createServiceCatalogItem:', error);
    throw error;
  }
};

/**
 * Update an existing service catalog item
 * @param id The ID of the service catalog item to update
 * @param item The updated service catalog item data
 */
export const updateServiceCatalogItem = async (id: string, item: Partial<ServiceCatalogItem>) => {
  // Get the current user's tenant_id
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  if (!userData?.user) {
    throw new Error('User is not authenticated');
  }
  
  // Check if the user has the required role
  const { data: userDetails, error: roleError } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', userData.user.id)
    .single();
  
  if (roleError) {
    throw new Error(`Error fetching user role: ${roleError.message}`);
  }
  
  if (!userDetails) {
    throw new Error('User details not found');
  }
  
  // Check if user has admin or manager role
  if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
    throw new Error('You must be an admin or manager to update service catalog items');
  }
  
  // Remove tenant_id from the item if it exists to prevent changing it
  const { tenant_id, ...itemWithoutTenant } = item;
  
  // Use RPC call to bypass RLS
  const { data, error } = await supabase.rpc('update_service_catalog_item', {
    item_id: id,
    item_data: {
      ...itemWithoutTenant,
      updated_at: new Date().toISOString()
    }
  });

  if (error) throw error;
  return data;
};

/**
 * Delete a service catalog item
 * @param id The ID of the service catalog item to delete
 */
export const deleteServiceCatalogItem = async (id: string) => {
  // Get the current user's tenant_id
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  if (!userData?.user) {
    throw new Error('User is not authenticated');
  }
  
  // Check if the user has the required role
  const { data: userDetails, error: roleError } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', userData.user.id)
    .single();
  
  if (roleError) {
    throw new Error(`Error fetching user role: ${roleError.message}`);
  }
  
  if (!userDetails) {
    throw new Error('User details not found');
  }
  
  // Check if user has admin or manager role
  if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
    throw new Error('You must be an admin or manager to delete service catalog items');
  }
  
  // Use RPC call to bypass RLS
  const { error } = await supabase.rpc('delete_service_catalog_item', {
    item_id: id
  });

  if (error) throw error;
  return true;
};

/**
 * Fetch active service catalog items for the self-service portal
 * @param categoryId Optional category ID to filter by
 */
export const getActiveServiceCatalogItems = async (categoryId?: string) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userData.user.id)
      .single();
    
    if (roleError) {
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Call the RPC function to fetch active service catalog items for the tenant
    const { data, error } = await supabase.rpc('get_active_service_catalog_items', {
      tenant_id_param: tenant_id
      // Note: The categoryId filter is no longer applied here.
      // If filtering by category is needed on the portal page, it must be done client-side
      // after fetching all active items, or the RPC function needs modification.
    });
    
    if (error) {
      console.error('Error fetching active service catalog items via RPC:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching active service catalog items:', error);
    return [];
  }
};

/**
 * Fetch service catalog categories
 */
export const getServiceCatalogCategories = async () => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    // Get user's tenant_id
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userData.user.id)
      .single();
    
    if (roleError) {
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Use RPC function to fetch categories for the tenant (handles RLS based on SQL function definition)
    const { data, error } = await supabase.rpc('get_service_categories', {
      tenant_id_param: tenant_id
    });
    
    if (error) {
      console.error('Error fetching service catalog categories via RPC:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching service catalog categories:', error);
    throw error;
  }
};

/**
 * Get service catalog items grouped by category
 */
export const getServiceCatalogItemsByCategory = async () => {
  try {
    const [categories, items] = await Promise.all([
      getServiceCatalogCategories(),
      getActiveServiceCatalogItems()
    ]);

    const itemsByCategory: Record<string, { category: any, items: any[] }> = {};
    
    // Initialize with empty arrays for all categories
    categories.forEach((category: any) => {
      itemsByCategory[category.id] = {
        category,
        items: []
      };
    });
    
    // Add uncategorized group
    itemsByCategory['uncategorized'] = {
      category: { id: 'uncategorized', name: 'Uncategorized', description: null },
      items: []
    };
    
    // Group items
    items.forEach((item: any) => {
      if (item.category_id && itemsByCategory[item.category_id]) {
        itemsByCategory[item.category_id].items.push(item);
      } else {
        itemsByCategory['uncategorized'].items.push(item);
      }
    });
    
    // Convert to array and filter out empty categories
    return Object.values(itemsByCategory).filter(group => group.items.length > 0);
  } catch (error) {
    console.error('Error getting service catalog items by category:', error);
    return [];
  }
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
  console.log('Creating ticket from service:', { serviceId, userId });
  console.log('Form data:', formData);
  
  try {
    // First, get the service catalog item
    const service = await getServiceCatalogItem(serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    console.log('Service found:', service);
    
    // Get the user's tenant_id
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user details:', userError);
      throw new Error(`Error fetching user details: ${userError.message}`);
    }
    
    if (!userDetails) {
      console.error('User not found');
      throw new Error('User not found');
    }
    
    console.log('User details:', userDetails);
    
    // Get default status and priority
    const [status_id, priority_id] = await Promise.all([
      getDefaultStatusId(),
      getDefaultPriorityId()
    ]);
    
    // Prepare ticket data
    const ticketData = {
      title: `${service.name} Request`,
      description: formData.description || '',
      status_id,
      priority_id,
      category_id: service.category_id,
      service_id: service.id,
      created_by: userId,
      form_data: formData,
      tenant_id: userDetails.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Prepared ticket data:', ticketData);
    
    // Use RPC call to bypass RLS
    const { data, error } = await supabase.rpc('create_ticket_from_service', {
      ticket_data: ticketData
    });
    
    console.log('RPC response:', { data, error });
    
    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
    
    console.log('Ticket created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createTicketFromService:', error);
    throw error;
  }
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

import { templateCategories, templateServices } from '../lib/service-catalog-templates';
import { FormField, FormSection } from '../types/formBuilder';

// Function to provision default service catalog items for a new tenant
export const provisionDefaultServiceCatalog = async (organisationId: string): Promise<void> => {
  console.log(`Provisioning default service catalog for organisation: ${organisationId}`);
  try {
    // 1. Insert Categories
    const categoriesToInsert = templateCategories.map(cat => ({
      ...cat,
      organisation_id: organisationId,
      is_template: false, // Mark as non-template tenant data
    }));

    const { data: insertedCategories, error: categoryError } = await supabase
      .from('service_catalog_categories')
      .insert(categoriesToInsert)
      .select('id, name');

    if (categoryError) {
      console.error('Error inserting template categories:', categoryError);
      throw new Error(`Failed to insert service catalog categories: ${categoryError.message}`);
    }

    if (!insertedCategories || insertedCategories.length === 0) {
        console.error('No categories were inserted.');
        throw new Error('Failed to insert service catalog categories: No data returned.');
    }

    console.log('Successfully inserted categories:', insertedCategories);

    // Create a map of category names to their new IDs
    const categoryMap = insertedCategories.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {} as Record<string, string>);

    // 2. Insert Services (and their forms)
    const servicesToInsert = templateServices.map(ts => {
      const categoryId = categoryMap[ts.service.categoryName];
      if (!categoryId) {
        console.warn(`Could not find category ID for service: ${ts.service.name} (Category: ${ts.service.categoryName})`);
        // Skip this service or handle error appropriately
        return null; // Skip this service if category not found
      }

      // Prepare form data for JSONB columns
      let formFieldsJson: FormField[] | null = null;
      let formSectionsJson: FormSection[] | null = null;
      let formRoutingJson: any[] | null = null;

      if (ts.formDesign) {
        // Convert fields object back to array if needed, or handle as is if DB expects object
        // Assuming DB columns (form_fields, form_sections, form_routing) expect the structure from FormDesign
        // The service_catalog_services table expects JSONB, so the object structure should be fine.
        // However, the interface ServiceCatalogItem uses FormField[], so let's match that for form_fields.

        formFieldsJson = ts.formDesign.fields ? Object.values(ts.formDesign.fields) : [];
        formSectionsJson = ts.formDesign.sections || [];
        formRoutingJson = ts.formDesign.routing || [];
      }

      return {
        ...ts.service,
        organisation_id: organisationId,
        category_id: categoryId, // Ensure categoryId is assigned here
        is_template: false, // Mark as non-template tenant data
        form_fields: formFieldsJson,
        form_sections: formSectionsJson,
        form_routing: formRoutingJson,
        categoryName: undefined, // Remove temporary field
      };
    }).filter(service => service !== null); // Filter out any services that couldn't be mapped to a category

    if (servicesToInsert.length > 0) {
      const { error: serviceError } = await supabase
        .from('service_catalog_services')
        .insert(servicesToInsert as any); // Cast as any to bypass strict type checking if needed for categoryName removal

      if (serviceError) {
        console.error('Error inserting template services:', serviceError);
        // Attempt to clean up categories if services failed?
        console.warn('Attempting to clean up categories due to service insertion failure...');
        await supabase.from('service_catalog_categories').delete().in('id', insertedCategories.map(c => c.id));
        throw new Error(`Failed to insert service catalog services: ${serviceError.message}`);
      }
      console.log('Successfully inserted services.');
    } else {
        console.warn('No services were prepared for insertion.');
    }

    console.log(`Successfully provisioned default service catalog for organisation: ${organisationId}`);

  } catch (error) {
    console.error(`Error provisioning default service catalog for ${organisationId}:`, error);
    // Re-throw the error so the calling function (SignUpForm) knows it failed
    throw error;
  }
};
