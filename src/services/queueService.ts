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
