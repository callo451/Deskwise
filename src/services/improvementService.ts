import { supabase } from '../lib/supabase';
import { Improvement, ImprovementStatus, ImprovementPriority, ImprovementCategory } from '../types/database';
import { createTicketHistory } from './ticketService';

export interface CreateImprovementData {
  title: string;
  description: string;
  priority?: ImprovementPriority;
  category?: ImprovementCategory;
  benefits?: string;
  resources_required?: string;
  estimated_effort?: string;
  estimated_cost?: number;
  expected_roi?: string;
  service_id?: string;
  process_affected?: string;
  success_criteria?: string;
  assigned_to?: string;
  requested_by?: string;
}

export interface UpdateImprovementData {
  title?: string;
  description?: string;
  status?: ImprovementStatus;
  priority?: ImprovementPriority;
  category?: ImprovementCategory;
  benefits?: string;
  resources_required?: string;
  estimated_effort?: string;
  estimated_cost?: number;
  expected_roi?: string;
  service_id?: string | null;
  process_affected?: string | null;
  success_criteria?: string | null;
  implementation_notes?: string | null;
  assigned_to?: string | null;
  requested_by?: string | null;
  approved_by?: string | null;
  approval_date?: string | null;
  implementation_date?: string | null;
}

/**
 * Fetches improvements with optional filtering
 */
export const getImprovements = async (
  options: {
    status?: ImprovementStatus | ImprovementStatus[];
    priority?: ImprovementPriority | ImprovementPriority[];
    category?: ImprovementCategory | ImprovementCategory[];
    assigned_to?: string;
    created_by?: string;
    requested_by?: string;
    approved_by?: string;
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
    category,
    assigned_to,
    created_by,
    requested_by,
    approved_by,
    service_id,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  let query = supabase
    .from('improvements')
    .select(`
      *,
      created_by_user:users!improvements_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!improvements_assigned_to_fkey(id, first_name, last_name, email),
      requested_by_user:users!improvements_requested_by_fkey(id, first_name, last_name, email),
      approved_by_user:users!improvements_approved_by_fkey(id, first_name, last_name, email),
      service:services(id, name)
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

  if (category) {
    if (Array.isArray(category)) {
      query = query.in('category', category);
    } else {
      query = query.eq('category', category);
    }
  }

  if (assigned_to) {
    query = query.eq('assigned_to', assigned_to);
  }

  if (created_by) {
    query = query.eq('created_by', created_by);
  }

  if (requested_by) {
    query = query.eq('requested_by', requested_by);
  }

  if (approved_by) {
    query = query.eq('approved_by', approved_by);
  }

  if (service_id) {
    query = query.eq('service_id', service_id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { improvements: data, count };
};

/**
 * Fetches a single improvement by ID
 */
export const getImprovementById = async (id: string) => {
  const { data, error } = await supabase
    .from('improvements')
    .select(`
      *,
      created_by_user:users!improvements_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!improvements_assigned_to_fkey(id, first_name, last_name, email),
      requested_by_user:users!improvements_requested_by_fkey(id, first_name, last_name, email),
      approved_by_user:users!improvements_approved_by_fkey(id, first_name, last_name, email),
      service:services(id, name),
      improvement_history(*),
      related_tickets:improvement_ticket_links(
        ticket_id,
        tickets:ticket_id(id, title, status, priority, created_at)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates a new improvement
 */
export const createImprovement = async (improvementData: CreateImprovementData) => {
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

  // Set default values if not provided
  const newImprovement = {
    tenant_id: userDetails.tenant_id,
    title: improvementData.title,
    description: improvementData.description,
    status: 'proposed' as ImprovementStatus,
    priority: improvementData.priority || 'medium',
    category: improvementData.category || 'process',
    benefits: improvementData.benefits || null,
    resources_required: improvementData.resources_required || null,
    estimated_effort: improvementData.estimated_effort || null,
    estimated_cost: improvementData.estimated_cost || null,
    expected_roi: improvementData.expected_roi || null,
    service_id: improvementData.service_id || null,
    process_affected: improvementData.process_affected || null,
    success_criteria: improvementData.success_criteria || null,
    created_by: userData.user.id,
    assigned_to: improvementData.assigned_to || null,
    requested_by: improvementData.requested_by || userData.user.id,
    approved_by: null,
    approval_date: null,
    implementation_date: null,
    implementation_notes: null
  };

  const { data, error } = await supabase
    .from('improvements')
    .insert(newImprovement)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create improvement history entry
  await createImprovementHistory(
    data.id,
    'created',
    { improvement: data }
  );

  return data;
};

/**
 * Updates an existing improvement
 */
/**
 * Updates the status of an improvement
 */
export const updateImprovementStatus = async (id: string, newStatus: ImprovementStatus) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }
  
  // Update the improvement status
  const { data, error } = await supabase
    .from('improvements')
    .update({ status: newStatus })
    .eq('id', id)
    .select(`
      *,
      created_by_user:users!improvements_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!improvements_assigned_to_fkey(id, first_name, last_name, email),
      requested_by_user:users!improvements_requested_by_fkey(id, first_name, last_name, email),
      approved_by_user:users!improvements_approved_by_fkey(id, first_name, last_name, email),
      service:services(id, name),
      improvement_history(*),
      related_tickets:improvement_ticket_links(
        ticket_id,
        tickets:ticket_id(id, title, status, priority, created_at)
      )
    `)
    .single();
  
  if (error) {
    throw error;
  }
  
  // Create a history entry for the status change
  await createImprovementHistory(
    id,
    `Status changed to ${newStatus}`,
    { old_status: data.status, new_status: newStatus }
  );
  
  return data;
};

/**
 * Updates an existing improvement
 */
export const updateImprovement = async (id: string, improvementData: UpdateImprovementData) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the current improvement state to track changes
  const { data: currentImprovement, error: fetchError } = await supabase
    .from('improvements')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Prepare update data
  const updateData: any = { ...improvementData };
  
  // Handle status transitions
  if (improvementData.status) {
    // If transitioning to approved, set approval_date and approved_by
    if (improvementData.status === 'approved' && currentImprovement.status !== 'approved') {
      updateData.approval_date = new Date().toISOString();
      updateData.approved_by = userData.user.id;
    }
    
    // If transitioning to implemented, set implementation_date
    if (improvementData.status === 'implemented' && currentImprovement.status !== 'implemented') {
      updateData.implementation_date = new Date().toISOString();
    }
  }

  // Update the improvement
  const { data, error } = await supabase
    .from('improvements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entry with changes
  const changes: Record<string, { from: any; to: any }> = {};
  
  // Track changes
  Object.keys(improvementData).forEach(key => {
    if (improvementData[key as keyof UpdateImprovementData] !== currentImprovement[key as keyof Improvement]) {
      changes[key] = {
        from: currentImprovement[key as keyof Improvement],
        to: improvementData[key as keyof UpdateImprovementData]
      };
    }
  });

  if (Object.keys(changes).length > 0) {
    await createImprovementHistory(
      id,
      'updated',
      { changes }
    );
  }

  return data;
};

/**
 * Creates an improvement history entry
 */
export const createImprovementHistory = async (
  improvementId: string,
  action: string,
  details: Record<string, any>
) => {
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

  const historyEntry = {
    improvement_id: improvementId,
    user_id: userData.user.id,
    action,
    details,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('improvement_history')
    .insert(historyEntry)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Links a ticket to an improvement
 */
export const linkTicketToImprovement = async (improvementId: string, ticketId: string, userId: string) => {
  // Get the user's tenant_id
  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .single();
    
  if (userDetailsError) {
    throw userDetailsError;
  }

  // Check if link already exists
  const { data: existingLink } = await supabase
    .from('improvement_ticket_links')
    .select('id')
    .eq('improvement_id', improvementId)
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (existingLink) {
    return existingLink; // Link already exists
  }

  const linkData = {
    improvement_id: improvementId,
    ticket_id: ticketId,
    created_by: userId,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('improvement_ticket_links')
    .insert(linkData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both improvement and ticket
  await createImprovementHistory(
    improvementId,
    'linked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'linked_to_improvement',
    { improvement_id: improvementId }
  );

  return data;
};

/**
 * Unlinks a ticket from an improvement
 */
export const unlinkTicketFromImprovement = async (improvementId: string, ticketId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('improvement_ticket_links')
    .delete()
    .eq('improvement_id', improvementId)
    .eq('ticket_id', ticketId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both improvement and ticket
  await createImprovementHistory(
    improvementId,
    'unlinked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'unlinked_from_improvement',
    { improvement_id: improvementId }
  );

  return data;
};

/**
 * Gets improvement statistics
 */
export const getImprovementStats = async () => {
  const { data: userData } = await supabase.auth.getUser();
  
  // Get the user's tenant_id
  const { data: userDetails } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();

  const tenantId = userDetails?.tenant_id;

  // Get counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .from('improvements')
    .select('status, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('status');

  if (statusError) {
    throw statusError;
  }

  // Get counts by category
  const { data: categoryCounts, error: categoryError } = await supabase
    .from('improvements')
    .select('category, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('category');

  if (categoryError) {
    throw categoryError;
  }

  // Get counts by priority
  const { data: priorityCounts, error: priorityError } = await supabase
    .from('improvements')
    .select('priority, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('priority');

  if (priorityError) {
    throw priorityError;
  }

  // Get total count
  const { count: totalCount, error: totalCountError } = await supabase
    .from('improvements')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (totalCountError) {
    throw totalCountError;
  }

  // Get recently implemented improvements
  const { data: recentImplementations, error: recentError } = await supabase
    .from('improvements')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'implemented')
    .order('implementation_date', { ascending: false })
    .limit(5);

  if (recentError) {
    throw recentError;
  }

  return {
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    categoryCounts: categoryCounts.reduce((acc, curr) => {
      acc[curr.category] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    priorityCounts: priorityCounts.reduce((acc, curr) => {
      acc[curr.priority] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    totalCount,
    recentImplementations
  };
};

/**
 * Gets improvements related to a specific ticket
 */
export const getImprovementsForTicket = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('improvement_ticket_links')
    .select(`
      improvement_id,
      improvements:improvement_id(*)
    `)
    .eq('ticket_id', ticketId);

  if (error) {
    throw error;
  }

  return data.map(item => item.improvements);
};

/**
 * Converts a ticket to an improvement
 */
export const convertTicketToImprovement = async (ticketId: string, improvementData: CreateImprovementData) => {
  // Get ticket details
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Create the improvement
  const improvement = await createImprovement(improvementData);

  // Link the ticket to the improvement
  await linkTicketToImprovement(improvement.id, ticketId, improvement.created_by);

  return improvement;
};
