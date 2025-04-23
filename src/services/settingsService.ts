import { supabase } from '../lib/supabase';

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
