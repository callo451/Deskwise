import { supabase } from '../lib/supabase';
import { Problem, ProblemPriority, ProblemStatus, ProblemImpact, ProblemUrgency } from '../types/database';
import { createTicketHistory } from './ticketService';

export interface CreateProblemData {
  title: string;
  description: string;
  status?: ProblemStatus;
  priority?: ProblemPriority;
  impact?: ProblemImpact;
  urgency?: ProblemUrgency;
  symptoms?: string;
  workaround?: string;
  root_cause?: string;
  permanent_solution?: string;
  category_id?: string;
  service_id?: string;
  assigned_to?: string;
  related_incidents?: string[];
  known_error_db_entry?: boolean;
}

export interface UpdateProblemData {
  title?: string;
  description?: string;
  status?: ProblemStatus;
  priority?: ProblemPriority;
  impact?: ProblemImpact;
  urgency?: ProblemUrgency;
  symptoms?: string;
  workaround?: string;
  root_cause?: string;
  permanent_solution?: string;
  category_id?: string | null;
  service_id?: string | null;
  assigned_to?: string | null;
  related_incidents?: string[];
  resolved_date?: string | null;
  closed_date?: string | null;
  known_error_db_entry?: boolean;
}

/**
 * Fetches problems with optional filtering
 */
export const getProblems = async (
  options: {
    status?: ProblemStatus | ProblemStatus[];
    priority?: ProblemPriority | ProblemPriority[];
    impact?: ProblemImpact | ProblemImpact[];
    urgency?: ProblemUrgency | ProblemUrgency[];
    assigned_to?: string;
    created_by?: string;
    service_id?: string;
    category_id?: string;
    known_error_only?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}
) => {
  const {
    status,
    priority,
    impact,
    urgency,
    assigned_to,
    created_by,
    service_id,
    category_id,
    known_error_only,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  let query = supabase
    .from('problems')
    .select(`
      *,
      created_by_user:users!problems_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!problems_assigned_to_fkey(id, first_name, last_name, email),
      service:services(id, name),
      category:ticket_categories(id, name),
      related_tickets:problem_ticket_links(ticket_id)
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

  if (impact) {
    if (Array.isArray(impact)) {
      query = query.in('impact', impact);
    } else {
      query = query.eq('impact', impact);
    }
  }

  if (urgency) {
    if (Array.isArray(urgency)) {
      query = query.in('urgency', urgency);
    } else {
      query = query.eq('urgency', urgency);
    }
  }

  if (assigned_to) {
    query = query.eq('assigned_to', assigned_to);
  }

  if (created_by) {
    query = query.eq('created_by', created_by);
  }

  if (service_id) {
    query = query.eq('service_id', service_id);
  }

  if (category_id) {
    query = query.eq('category_id', category_id);
  }

  if (known_error_only) {
    query = query.eq('known_error_db_entry', true);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { problems: data, count };
};

/**
 * Fetches a single problem by ID
 */
export const getProblem = async (id: string) => {
  return getProblemById(id);
};

export const getProblemById = async (id: string) => {
  const { data, error } = await supabase
    .from('problems')
    .select(`
      *,
      created_by_user:users!problems_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!problems_assigned_to_fkey(id, first_name, last_name, email),
      service:services(id, name),
      category:ticket_categories(id, name),
      problem_history(*),
      related_tickets:problem_ticket_links(
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
 * Creates a new problem
 */
export const createProblem = async (problemData: CreateProblemData) => {
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
  const now = new Date().toISOString();
  const newProblem = {
    tenant_id: userDetails.tenant_id,
    title: problemData.title,
    description: problemData.description,
    status: problemData.status || 'identified',
    priority: problemData.priority || 'medium',
    impact: problemData.impact || 'medium',
    urgency: problemData.urgency || 'medium',
    symptoms: problemData.symptoms || null,
    workaround: problemData.workaround || null,
    root_cause: problemData.root_cause || null,
    permanent_solution: problemData.permanent_solution || null,
    category_id: problemData.category_id || null,
    service_id: problemData.service_id || null,
    created_by: userData.user.id,
    assigned_to: problemData.assigned_to || null,
    identified_date: now,
    resolved_date: null,
    closed_date: null,
    related_incidents: problemData.related_incidents || null,
    known_error_db_entry: problemData.known_error_db_entry || false,
  };

  const { data, error } = await supabase
    .from('problems')
    .insert(newProblem)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create problem history entry
  await createProblemHistory(
    data.id,
    'created',
    { problem: data }
  );

  // Link related incidents if provided
  if (problemData.related_incidents && problemData.related_incidents.length > 0) {
    const linkPromises = problemData.related_incidents.map(ticketId => 
      linkTicketToProblem(data.id, ticketId, userData.user.id)
    );
    await Promise.all(linkPromises);
  }

  return data;
};

/**
 * Updates an existing problem
 */
export const updateProblem = async (id: string, problemData: UpdateProblemData) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the current problem state to track changes
  const { data: currentProblem, error: fetchError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Prepare update data
  const updateData: any = { ...problemData };
  
  // Handle status transitions
  if (problemData.status) {
    // If transitioning to resolved, set resolved_date
    if (problemData.status === 'resolved' && currentProblem.status !== 'resolved') {
      updateData.resolved_date = new Date().toISOString();
    }
    
    // If transitioning to closed, set closed_date
    if (problemData.status === 'closed' && currentProblem.status !== 'closed') {
      updateData.closed_date = new Date().toISOString();
    }
  }

  // Update the problem
  const { data, error } = await supabase
    .from('problems')
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
  Object.keys(problemData).forEach(key => {
    if (problemData[key as keyof UpdateProblemData] !== currentProblem[key as keyof Problem]) {
      changes[key] = {
        from: currentProblem[key as keyof Problem],
        to: problemData[key as keyof UpdateProblemData]
      };
    }
  });

  if (Object.keys(changes).length > 0) {
    await createProblemHistory(
      id,
      'updated',
      { changes }
    );
  }

  // Handle related incidents if provided
  if (problemData.related_incidents) {
    // Get current linked tickets
    const { data: currentLinks } = await supabase
      .from('problem_ticket_links')
      .select('ticket_id')
      .eq('problem_id', id);
    
    const currentTicketIds = currentLinks?.map(link => link.ticket_id) || [];
    const newTicketIds = problemData.related_incidents;
    
    // Tickets to add (in new but not in current)
    const ticketsToAdd = newTicketIds.filter(ticketId => !currentTicketIds.includes(ticketId));
    
    // Tickets to remove (in current but not in new)
    const ticketsToRemove = currentTicketIds.filter(ticketId => !newTicketIds.includes(ticketId));
    
    // Add new links
    const addPromises = ticketsToAdd.map(ticketId => 
      linkTicketToProblem(id, ticketId, userData.user.id)
    );
    
    // Remove old links
    const removePromises = ticketsToRemove.map(ticketId => 
      unlinkTicketFromProblem(id, ticketId)
    );
    
    await Promise.all([...addPromises, ...removePromises]);
  }

  return data;
};

/**
 * Creates a problem history entry
 */
export const createProblemHistory = async (
  problemId: string,
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
    problem_id: problemId,
    user_id: userData.user.id,
    action,
    details,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('problem_history')
    .insert(historyEntry)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Links a ticket to a problem
 */
export const linkTicketToProblem = async (problemId: string, ticketId: string, userId: string) => {
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
    .from('problem_ticket_links')
    .select('id')
    .eq('problem_id', problemId)
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (existingLink) {
    return existingLink; // Link already exists
  }

  const linkData = {
    problem_id: problemId,
    ticket_id: ticketId,
    created_by: userId,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('problem_ticket_links')
    .insert(linkData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both problem and ticket
  await createProblemHistory(
    problemId,
    'linked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'linked_to_problem',
    { problem_id: problemId }
  );

  return data;
};

/**
 * Unlinks a ticket from a problem
 */
export const unlinkTicketFromProblem = async (problemId: string, ticketId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('problem_ticket_links')
    .delete()
    .eq('problem_id', problemId)
    .eq('ticket_id', ticketId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both problem and ticket
  await createProblemHistory(
    problemId,
    'unlinked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'unlinked_from_problem',
    { problem_id: problemId }
  );

  return data;
};

/**
 * Gets problem statistics
 */
export const getProblemStats = async () => {
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
    .from('problems')
    .select('status, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('status');

  if (statusError) {
    throw statusError;
  }

  // Get counts by priority
  const { data: priorityCounts, error: priorityError } = await supabase
    .from('problems')
    .select('priority, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('priority');

  if (priorityError) {
    throw priorityError;
  }

  // Get known error count
  const { count: knownErrorCount, error: knownErrorCountError } = await supabase
    .from('problems')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('known_error_db_entry', true);

  if (knownErrorCountError) {
    throw knownErrorCountError;
  }

  // Get total count
  const { count: totalCount, error: totalCountError } = await supabase
    .from('problems')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (totalCountError) {
    throw totalCountError;
  }

  return {
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    priorityCounts: priorityCounts.reduce((acc, curr) => {
      acc[curr.priority] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    knownErrorCount,
    totalCount
  };
};

/**
 * Converts a ticket to a problem
 */
export const convertTicketToProblem = async (ticketId: string, problemData: CreateProblemData) => {
  // Get ticket details
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Create the problem
  const problem = await createProblem({
    ...problemData,
    related_incidents: [ticketId]
  });

  return problem;
};

/**
 * Gets problems related to a specific ticket
 */
export const getProblemsForTicket = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('problem_ticket_links')
    .select(`
      problem_id,
      problems:problem_id(*)
    `)
    .eq('ticket_id', ticketId);

  if (error) {
    throw error;
  }

  return data.map(item => item.problems);
};
