import { supabase } from '../lib/supabase';

export interface QueueItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueueAssignment {
  id: string;
  queue_id: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface QueueUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Fetch all queues for the current tenant
 */
export const getQueues = async () => {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data as QueueItem[];
};

/**
 * Fetch a single queue by ID
 */
export const getQueue = async (id: string) => {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as QueueItem;
};

/**
 * Create a new queue
 */
export const createQueue = async (queue: Omit<QueueItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
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
    .from('queues')
    .insert({
      ...queue,
      tenant_id: userDetails.tenant_id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as QueueItem;
};

/**
 * Update an existing queue
 */
export const updateQueue = async (id: string, queue: Partial<Omit<QueueItem, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('queues')
    .update(queue)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as QueueItem;
};

/**
 * Delete a queue
 */
export const deleteQueue = async (id: string) => {
  // Check if this queue is used by any tickets
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', id);

  if (countError) throw countError;

  // Don't delete if tickets are using this queue
  if (count && count > 0) {
    throw new Error(`Cannot delete queue that is used by ${count} tickets`);
  }

  const { error } = await supabase
    .from('queues')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Get tickets for a specific queue
 */
export const getQueueTickets = async (queueId: string, options: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
} = {}) => {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  const { data, error, count } = await supabase
    .from('tickets')
    .select(`
      *,
      created_by_user:users!tickets_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!tickets_assigned_to_fkey(id, first_name, last_name, email),
      queue:queues(id, name),
      service:services(id, name),
      priority_details:ticket_priorities(id, name, color),
      status_details:ticket_statuses(id, name, color),
      category:ticket_categories(id, name),
      sla:slas(id, name, response_time_minutes, resolution_time_minutes, business_hours_only)
    `, { count: 'exact' })
    .eq('queue_id', queueId)
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return { tickets: data, count };
};

/**
 * Get users assigned to a queue
 */
export const getQueueAssignments = async (queueId: string) => {
  const { data, error } = await supabase
    .from('queue_assignments')
    .select(`
      *,
      user:users(id, email, first_name, last_name)
    `)
    .eq('queue_id', queueId);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Assign a user to a queue
 */
export const assignUserToQueue = async (queueId: string, userId: string) => {
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
    .from('queue_assignments')
    .insert({
      queue_id: queueId,
      user_id: userId,
      tenant_id: userDetails.tenant_id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as QueueAssignment;
};

/**
 * Remove a user from a queue
 */
export const removeUserFromQueue = async (assignmentId: string) => {
  const { error } = await supabase
    .from('queue_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Get all available users that can be assigned to queues
 */
export const getAvailableUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .order('first_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data as QueueUser[];
};

/**
 * Get queues assigned to a user
 */
export const getUserQueues = async (userId: string) => {
  const { data, error } = await supabase
    .from('queue_assignments')
    .select(`
      *,
      queue:queues(id, name, description, is_active)
    `)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data;
};
