import { supabase } from '../lib/supabase';
import {
  defaultTicketPriorities,
  defaultTicketCategories,
  defaultTicketStatuses
} from '../lib/ticket-settings-templates'; // Import the defaults

export interface TicketStatusItem {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketPriorityItem {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketCategoryItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Ticket Priorities
export const getTicketPriorities = async () => {
  const { data, error } = await supabase
    .from('ticket_priorities')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as TicketPriorityItem[];
};

export const getTicketPriority = async (id: string) => {
  const { data, error } = await supabase
    .from('ticket_priorities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as TicketPriorityItem;
};

export const createTicketPriority = async (priority: Omit<TicketPriorityItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
  // Get user's tenant_id
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();
  
  if (userDetailsError) throw userDetailsError;

  const { data, error } = await supabase
    .from('ticket_priorities')
    .insert({
      ...priority,
      tenant_id: userDetails.tenant_id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketPriorityItem;
};

export const updateTicketPriority = async (id: string, priority: Partial<Omit<TicketPriorityItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('ticket_priorities')
    .update(priority)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketPriorityItem;
};

export const deleteTicketPriority = async (id: string) => {
  // Check if this priority is used by any tickets
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('priority_id', id);

  if (countError) throw countError;

  // Don't delete if tickets are using this priority
  if (count && count > 0) {
    throw new Error(`Cannot delete priority that is used by ${count} tickets`);
  }

  const { error } = await supabase
    .from('ticket_priorities')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

// Ticket Categories
export const getTicketCategories = async () => {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as TicketCategoryItem[];
};

export const getTicketCategory = async (id: string) => {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as TicketCategoryItem;
};

export const createTicketCategory = async (category: Omit<TicketCategoryItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
  // Get user's tenant_id
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();
  
  if (userDetailsError) throw userDetailsError;

  const { data, error } = await supabase
    .from('ticket_categories')
    .insert({
      ...category,
      tenant_id: userDetails.tenant_id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketCategoryItem;
};

export const updateTicketCategory = async (id: string, category: Partial<Omit<TicketCategoryItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('ticket_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketCategoryItem;
};

export const deleteTicketCategory = async (id: string) => {
  // Check if this category is used by any tickets
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) throw countError;

  // Don't delete if tickets are using this category
  if (count && count > 0) {
    throw new Error(`Cannot delete category that is used by ${count} tickets`);
  }

  const { error } = await supabase
    .from('ticket_categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

// Ticket Statuses
export const getTicketStatuses = async () => {
  const { data, error } = await supabase
    .from('ticket_statuses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as TicketStatusItem[];
};

export const getTicketStatus = async (id: string) => {
  const { data, error } = await supabase
    .from('ticket_statuses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as TicketStatusItem;
};

export const createTicketStatus = async (status: Omit<TicketStatusItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
  // Get user's tenant_id
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();
  
  if (userDetailsError) throw userDetailsError;

  const { data, error } = await supabase
    .from('ticket_statuses')
    .insert({
      ...status,
      tenant_id: userDetails.tenant_id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketStatusItem;
};

export const updateTicketStatus = async (id: string, status: Partial<Omit<TicketStatusItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('ticket_statuses')
    .update(status)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TicketStatusItem;
};

export const deleteTicketStatus = async (id: string) => {
  // Check if this status is used by any tickets
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status_id', id);

  if (countError) throw countError;

  // Don't delete if tickets are using this status
  if (count && count > 0) {
    throw new Error(`Cannot delete status that is used by ${count} tickets`);
  }

  const { error } = await supabase
    .from('ticket_statuses')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

// --- Provisioning Defaults for New Tenants ---

/**
 * Provisions default ticket settings (priorities, categories, statuses)
 * for a newly created tenant.
 * Should be called during the sign-up process after tenant creation.
 * 
 * @param organisationId The UUID of the new tenant/organisation.
 */
export const provisionDefaultTicketSettings = async (organisationId: string): Promise<void> => {
  console.log(`Provisioning default ticket settings for organisation: ${organisationId}`);

  try {
    // 1. Prepare data with the correct tenant_id
    const prioritiesToInsert = defaultTicketPriorities.map(p => ({ 
      ...p, 
      tenant_id: organisationId 
    }));
    const categoriesToInsert = defaultTicketCategories.map(c => ({ 
      ...c, 
      tenant_id: organisationId 
    }));
    const statusesToInsert = defaultTicketStatuses.map(s => ({ 
      ...s, 
      tenant_id: organisationId 
    }));

    // 2. Perform insertions concurrently
    const results = await Promise.allSettled([
      supabase.from('ticket_priorities').insert(prioritiesToInsert),
      supabase.from('ticket_categories').insert(categoriesToInsert),
      supabase.from('ticket_statuses').insert(statusesToInsert),
      // Add insert operations for default SLAs and Queues here if needed later
    ]);

    // 3. Check results and log errors
    const errors: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        let tableName = '';
        if (index === 0) tableName = 'ticket_priorities';
        else if (index === 1) tableName = 'ticket_categories';
        else if (index === 2) tableName = 'ticket_statuses';
        // Add cases for SLAs/Queues if added
        
        console.error(`Error inserting default ${tableName}:`, result.reason);
        errors.push(`Failed to insert default ${tableName}.`);
      }
    });

    if (errors.length > 0) {
      // Throw a consolidated error if any insertion failed
      throw new Error(`Failed to provision some default ticket settings: ${errors.join(' ')}`);
    }

    console.log(`Successfully provisioned default ticket settings for organisation: ${organisationId}`);

  } catch (error: any) {
    console.error(`Error during provisionDefaultTicketSettings for ${organisationId}:`, error);
    // Re-throw the error to be caught by the calling function (e.g., in SignUpForm)
    throw error;
  }
};
