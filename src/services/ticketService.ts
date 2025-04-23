import { supabase } from '../lib/supabase';
import { TicketPriority, TicketStatus } from '../types/database';
import { getTicketPriorities, getTicketStatuses } from './settingsService';
import { calculateSLADeadlines, updateSLAMetrics } from './slaService';

export interface CreateTicketData {
  title: string;
  description: string;
  priority?: TicketPriority;
  priority_id?: string;
  status_id?: string;
  category_id?: string;
  queue_id?: string;
  service_id?: string;
  assigned_to?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  status_id?: string;
  priority?: TicketPriority;
  priority_id?: string;
  category_id?: string | null;
  queue_id?: string | null;
  service_id?: string | null;
  assigned_to?: string | null;
  due_at?: string | null;
}

/**
 * Fetches tickets with optional filtering
 */
export const getTickets = async (
  options: {
    status?: TicketStatus | TicketStatus[];
    priority?: TicketPriority | TicketPriority[];
    assigned_to?: string;
    created_by?: string;
    queue_id?: string;
    service_id?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}
) => {
  const {
    status,
    priority,
    assigned_to,
    created_by,
    queue_id,
    service_id,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  let query = supabase
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
    `)
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + limit - 1);

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  if (priority) {
    if (Array.isArray(priority)) {
      query = query.in('priority', priority);
    } else {
      query = query.eq('priority', priority);
    }
  }

  if (assigned_to) {
    query = query.eq('assigned_to', assigned_to);
  }

  if (created_by) {
    query = query.eq('created_by', created_by);
  }

  if (queue_id) {
    query = query.eq('queue_id', queue_id);
  }

  if (service_id) {
    query = query.eq('service_id', service_id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { tickets: data, count };
};

/**
 * Fetches a single ticket by ID
 */
export const getTicket = async (id: string) => {
  return getTicketById(id);
};

export const getTicketById = async (id: string) => {
  const { data, error } = await supabase
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
      sla:slas(id, name, response_time_minutes, resolution_time_minutes, business_hours_only),
      ticket_history(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates a new ticket
 */
export const createTicket = async (ticketData: CreateTicketData) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the user's tenant_id
  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();
    
  if (userDetailsError) {
    throw userDetailsError;
  }

  // Get default status if not provided
  let statusId = ticketData.status_id;
  if (!statusId) {
    const statuses = await getTicketStatuses();
    const defaultStatus = statuses.find(s => s.is_default);
    if (defaultStatus) {
      statusId = defaultStatus.id;
    }
  }

  // Get default priority if not provided
  let priorityId = ticketData.priority_id;
  if (!priorityId) {
    const priorities = await getTicketPriorities();
    const defaultPriority = priorities.find(p => p.is_default);
    if (defaultPriority) {
      priorityId = defaultPriority.id;
    }
  }

  // Calculate SLA deadlines if priority is provided
  let slaData: {
    slaId: string | null;
    responseDeadline: string | null;
    resolutionDeadline: string | null;
  } = {
    slaId: null,
    responseDeadline: null,
    resolutionDeadline: null
  };
  
  if (priorityId) {
    try {
      slaData = await calculateSLADeadlines(
        '', // Ticket ID will be assigned after creation
        priorityId,
        ticketData.category_id || null,
        ticketData.service_id || null,
        new Date().toISOString()
      );
    } catch (slaError) {
      console.error('Error calculating SLA deadlines:', slaError);
      // Continue with ticket creation even if SLA calculation fails
    }
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      ...ticketData,
      tenant_id: userDetails.tenant_id,
      created_by: userData.user.id,
      status_id: statusId,
      priority_id: priorityId,
      sla_id: slaData.slaId,
      response_deadline: slaData.responseDeadline,
      resolution_deadline: slaData.resolutionDeadline,
      sla_status: 'within'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create ticket history entry
  await createTicketHistory(data.id, 'created', {
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: data.status,
  });

  return data;
};
/**
 * Updates an existing ticket
 */
export const updateTicket = async (id: string, ticketData: UpdateTicketData) => {
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Create history entry before updating
  await createTicketHistory(id, 'update', ticketData);

  // Check if priority or category changed, which might affect SLA
  let slaUpdates: Record<string, any> = {};
  if ((ticketData.priority_id && ticketData.priority_id !== currentTicket.priority_id) ||
      (ticketData.category_id !== undefined && ticketData.category_id !== currentTicket.category_id) ||
      (ticketData.service_id !== undefined && ticketData.service_id !== currentTicket.service_id)) {
    try {
      const slaData = await calculateSLADeadlines(
        id,
        ticketData.priority_id || currentTicket.priority_id,
        ticketData.category_id !== undefined ? ticketData.category_id : currentTicket.category_id,
        ticketData.service_id !== undefined ? ticketData.service_id : currentTicket.service_id,
        currentTicket.created_at
      );
      
      slaUpdates = {
        sla_id: slaData.slaId,
        response_deadline: slaData.responseDeadline,
        resolution_deadline: slaData.resolutionDeadline
      };
    } catch (error) {
      console.error('Error calculating SLA deadlines:', error);
    }
  }

  // Check if this is a first response
  let slaMetricUpdates: Record<string, any> = {};
  
  // If this is the first update and no first_response_time is set, mark this as the first response
  if (!currentTicket.first_response_time) {
    slaMetricUpdates = {
      first_response_time: new Date().toISOString()
    };
    
    // Update SLA metrics
    try {
      await updateSLAMetrics(id, { firstResponseTime: slaMetricUpdates.first_response_time });
    } catch (error) {
      console.error('Error updating SLA metrics:', error);
    }
  }
  
  // If status changed to a closed status, update SLA status
  if (ticketData.status_id && ticketData.status_id !== currentTicket.status_id) {
    const { data: newStatus } = await supabase
      .from('ticket_statuses')
      .select('is_closed')
      .eq('id', ticketData.status_id)
      .single();
      
    if (newStatus?.is_closed) {
      // Check if resolution is within SLA
      if (currentTicket.resolution_deadline) {
        const now = new Date();
        const deadline = new Date(currentTicket.resolution_deadline);
        
        if (now > deadline) {
          slaMetricUpdates.sla_status = 'breached';
        } else {
          slaMetricUpdates.sla_status = 'met';
        }
        
        // Update SLA metrics
        try {
          await updateSLAMetrics(id, { slaStatus: slaMetricUpdates.sla_status });
        } catch (error) {
          console.error('Error updating SLA metrics:', error);
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      ...ticketData,
      ...slaUpdates,
      ...slaMetricUpdates
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
 * Creates a ticket history entry
 */
export const createTicketHistory = async (
  ticketId: string,
  action: string,
  changes: Record<string, any>
) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get tenant_id from the ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .select('tenant_id')
    .eq('id', ticketId)
    .single();

  if (ticketError) {
    throw ticketError;
  }

  const { data, error } = await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      tenant_id: ticketData.tenant_id,
      user_id: userData.user.id,
      action,
      changes,
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Gets ticket statistics
 */
/**
 * Fetches tickets created by a specific user
 */
export const getTicketsByUser = async (userId: string) => {
  const { data, error, count } = await supabase
    .from('tickets')
    .select(`
      *,
      priority_details:ticket_priorities(id, name, color),
      status_details:ticket_statuses(id, name, color),
      category:ticket_categories(id, name)
    `, { count: 'exact' })
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return { tickets: data || [], count };
};

export const getTicketStats = async () => {
  const { data: openTickets, error: openError } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .eq('status', 'open');

  const { data: inProgressTickets, error: inProgressError } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .eq('status', 'in_progress');

  const { data: resolvedTickets, error: resolvedError } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .eq('status', 'resolved');

  if (openError || inProgressError || resolvedError) {
    throw openError || inProgressError || resolvedError;
  }

  return {
    open: openTickets?.length || 0,
    inProgress: inProgressTickets?.length || 0,
    resolved: resolvedTickets?.length || 0,
  };
};
