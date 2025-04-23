import { supabase } from '../lib/supabase';
import { Change, ChangeStatus, ChangeType, ChangeRiskLevel, ChangeImpact } from '../types/database';
import { createTicketHistory } from './ticketService';
import { createProblemHistory } from './problemService';

export interface CreateChangeData {
  title: string;
  description: string;
  change_type?: ChangeType;
  risk_level?: ChangeRiskLevel;
  impact?: ChangeImpact;
  justification: string;
  implementation_plan?: string;
  test_plan?: string;
  backout_plan?: string;
  category_id?: string;
  service_id?: string;
  assigned_to?: string;
  requested_by?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  affected_services?: string[];
  affected_configuration_items?: string[];
}

export interface UpdateChangeData {
  title?: string;
  description?: string;
  status?: ChangeStatus;
  change_type?: ChangeType;
  risk_level?: ChangeRiskLevel;
  impact?: ChangeImpact;
  justification?: string;
  implementation_plan?: string;
  test_plan?: string;
  backout_plan?: string;
  category_id?: string | null;
  service_id?: string | null;
  assigned_to?: string | null;
  requested_by?: string | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  affected_services?: string[];
  affected_configuration_items?: string[];
  review_notes?: string;
  implementation_notes?: string;
}

/**
 * Fetches changes with optional filtering
 */
export const getChanges = async (
  options: {
    status?: ChangeStatus | ChangeStatus[];
    change_type?: ChangeType | ChangeType[];
    risk_level?: ChangeRiskLevel | ChangeRiskLevel[];
    impact?: ChangeImpact | ChangeImpact[];
    assigned_to?: string;
    created_by?: string;
    requested_by?: string;
    service_id?: string;
    category_id?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}
) => {
  const {
    status,
    change_type,
    risk_level,
    impact,
    assigned_to,
    created_by,
    requested_by,
    service_id,
    category_id,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  let query = supabase
    .from('changes')
    .select(`
      *,
      created_by_user:users!changes_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!changes_assigned_to_fkey(id, first_name, last_name, email),
      requested_by_user:users!changes_requested_by_fkey(id, first_name, last_name, email),
      service:services(id, name),
      category:ticket_categories(id, name),
      approvals:change_approvals(id, approver_id, status, approval_date, 
        approver:approver_id(id, first_name, last_name, email)
      ),
      schedule:change_schedules(id, scheduled_start, scheduled_end, maintenance_window)
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

  if (change_type) {
    if (Array.isArray(change_type)) {
      query = query.in('change_type', change_type);
    } else {
      query = query.eq('change_type', change_type);
    }
  }

  if (risk_level) {
    if (Array.isArray(risk_level)) {
      query = query.in('risk_level', risk_level);
    } else {
      query = query.eq('risk_level', risk_level);
    }
  }

  if (impact) {
    if (Array.isArray(impact)) {
      query = query.in('impact', impact);
    } else {
      query = query.eq('impact', impact);
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

  if (service_id) {
    query = query.eq('service_id', service_id);
  }

  if (category_id) {
    query = query.eq('category_id', category_id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { changes: data, count };
};

/**
 * Fetches a single change by ID
 */
export const getChange = async (id: string) => {
  return getChangeById(id);
};

export const getChangeById = async (id: string) => {
  const { data, error } = await supabase
    .from('changes')
    .select(`
      *,
      created_by_user:users!changes_created_by_fkey(id, first_name, last_name, email),
      assigned_to_user:users!changes_assigned_to_fkey(id, first_name, last_name, email),
      requested_by_user:users!changes_requested_by_fkey(id, first_name, last_name, email),
      service:services(id, name),
      category:ticket_categories(id, name),
      change_history(*),
      approvals:change_approvals(
        id, approver_id, status, comments, approval_date, created_at,
        approver:approver_id(id, first_name, last_name, email, role)
      ),
      schedule:change_schedules(id, scheduled_start, scheduled_end, maintenance_window, notification_sent),
      related_tickets:change_ticket_links(
        ticket_id,
        tickets:ticket_id(id, title, status, priority, created_at)
      ),
      related_problems:change_problem_links(
        problem_id,
        problems:problem_id(id, title, status, priority, impact, created_at)
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
 * Creates a new change
 */
export const createChange = async (changeData: CreateChangeData) => {
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
  const newChange = {
    tenant_id: userDetails.tenant_id,
    title: changeData.title,
    description: changeData.description,
    status: 'draft' as ChangeStatus,
    change_type: changeData.change_type || 'normal',
    risk_level: changeData.risk_level || 'medium',
    impact: changeData.impact || 'department',
    justification: changeData.justification,
    implementation_plan: changeData.implementation_plan || null,
    test_plan: changeData.test_plan || null,
    backout_plan: changeData.backout_plan || null,
    category_id: changeData.category_id || null,
    service_id: changeData.service_id || null,
    created_by: userData.user.id,
    assigned_to: changeData.assigned_to || null,
    requested_by: changeData.requested_by || userData.user.id,
    approved_by: null,
    planned_start_date: changeData.planned_start_date || null,
    planned_end_date: changeData.planned_end_date || null,
    actual_start_date: null,
    actual_end_date: null,
    affected_services: changeData.affected_services || null,
    affected_configuration_items: changeData.affected_configuration_items || null,
    review_notes: null,
    implementation_notes: null
  };

  const { data, error } = await supabase
    .from('changes')
    .insert(newChange)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create change history entry
  await createChangeHistory(
    data.id,
    'created',
    { change: data }
  );

  // Create change schedule if planned dates are provided
  if (changeData.planned_start_date && changeData.planned_end_date) {
    await createChangeSchedule(data.id, {
      scheduled_start: changeData.planned_start_date,
      scheduled_end: changeData.planned_end_date,
      maintenance_window: false
    });
  }

  return data;
};

/**
 * Updates an existing change
 */
export const updateChangeStatus = async (id: string, status: ChangeStatus) => {
  return updateChange(id, { status });
};

export const updateChange = async (id: string, changeData: UpdateChangeData) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the current change state to track changes
  const { data: currentChange, error: fetchError } = await supabase
    .from('changes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Prepare update data
  const updateData: any = { ...changeData };
  
  // Handle status transitions
  if (changeData.status) {
    // If transitioning to implementation, set actual_start_date
    if (changeData.status === 'implementation' && currentChange.status !== 'implementation') {
      updateData.actual_start_date = new Date().toISOString();
    }
    
    // If transitioning to closed or review, set actual_end_date
    if ((changeData.status === 'closed' || changeData.status === 'review') && 
        currentChange.status !== 'closed' && currentChange.status !== 'review') {
      updateData.actual_end_date = new Date().toISOString();
    }
  }

  // Update the change
  const { data, error } = await supabase
    .from('changes')
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
  Object.keys(changeData).forEach(key => {
    if (changeData[key as keyof UpdateChangeData] !== currentChange[key as keyof Change]) {
      changes[key] = {
        from: currentChange[key as keyof Change],
        to: changeData[key as keyof UpdateChangeData]
      };
    }
  });

  if (Object.keys(changes).length > 0) {
    await createChangeHistory(
      id,
      'updated',
      { changes }
    );
  }

  // Update change schedule if planned dates are updated
  if (changeData.planned_start_date || changeData.planned_end_date) {
    // Get current schedule
    const { data: currentSchedule } = await supabase
      .from('change_schedules')
      .select('*')
      .eq('change_id', id)
      .maybeSingle();

    if (currentSchedule) {
      // Update existing schedule
      await updateChangeSchedule(currentSchedule.id, {
        scheduled_start: changeData.planned_start_date || currentSchedule.scheduled_start,
        scheduled_end: changeData.planned_end_date || currentSchedule.scheduled_end
      });
    } else if (changeData.planned_start_date && changeData.planned_end_date) {
      // Create new schedule
      await createChangeSchedule(id, {
        scheduled_start: changeData.planned_start_date,
        scheduled_end: changeData.planned_end_date,
        maintenance_window: false
      });
    }
  }

  return data;
};

/**
 * Creates a change history entry
 */
export const createChangeHistory = async (
  changeId: string,
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
    change_id: changeId,
    user_id: userData.user.id,
    action,
    details,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('change_history')
    .insert(historyEntry)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates or updates a change approval
 */
export const submitChangeApproval = async (
  changeId: string, 
  status: 'approved' | 'rejected', 
  comments?: string
) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the user's tenant_id
  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', userData.user.id)
    .single();
    
  if (userDetailsError) {
    throw userDetailsError;
  }

  // Check if user has approval rights (manager or admin)
  if (!['manager', 'admin'].includes(userDetails.role)) {
    throw new Error('User does not have approval rights');
  }

  // Check if approval already exists
  const { data: existingApproval } = await supabase
    .from('change_approvals')
    .select('*')
    .eq('change_id', changeId)
    .eq('approver_id', userData.user.id)
    .maybeSingle();

  const approvalData = {
    change_id: changeId,
    approver_id: userData.user.id,
    status,
    comments: comments || null,
    approval_date: new Date().toISOString(),
    tenant_id: userDetails.tenant_id
  };

  let result;

  if (existingApproval) {
    // Update existing approval
    const { data, error } = await supabase
      .from('change_approvals')
      .update(approvalData)
      .eq('id', existingApproval.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    result = data;
  } else {
    // Create new approval
    const { data, error } = await supabase
      .from('change_approvals')
      .insert(approvalData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    result = data;
  }

  // Create history entry
  await createChangeHistory(
    changeId,
    status === 'approved' ? 'approved' : 'rejected',
    { 
      approver: userData.user.id,
      comments
    }
  );

  // Check if all required approvals are complete and update change status if needed
  await checkAndUpdateChangeApprovalStatus(changeId);

  return result;
};

/**
 * Checks if all required approvals are complete and updates change status
 */
export const checkAndUpdateChangeApprovalStatus = async (changeId: string) => {
  // Get change details
  const { data: change } = await supabase
    .from('changes')
    .select('*')
    .eq('id', changeId)
    .single();

  if (!change || change.status !== 'approval') {
    return; // Only process changes in approval status
  }

  // Get all approvals
  const { data: approvals } = await supabase
    .from('change_approvals')
    .select('*')
    .eq('change_id', changeId);

  if (!approvals || approvals.length === 0) {
    return; // No approvals yet
  }

  // Check if any rejections
  const hasRejection = approvals.some(approval => approval.status === 'rejected');
  
  if (hasRejection) {
    // Update change to rejected
    await supabase
      .from('changes')
      .update({ status: 'rejected' })
      .eq('id', changeId);
      
    await createChangeHistory(
      changeId,
      'status_changed',
      { 
        from: 'approval',
        to: 'rejected',
        reason: 'One or more approvers rejected the change'
      }
    );
    
    return;
  }

  // For simplicity, we'll assume that at least 2 approvals are needed for high/very_high risk changes
  // and 1 approval for medium/low risk changes
  const minRequiredApprovals = (change.risk_level === 'high' || change.risk_level === 'very_high') ? 2 : 1;
  
  const approvedCount = approvals.filter(approval => approval.status === 'approved').length;
  
  if (approvedCount >= minRequiredApprovals) {
    // All required approvals received, move to scheduled status
    await supabase
      .from('changes')
      .update({ 
        status: 'scheduled',
        approved_by: approvals
          .filter(approval => approval.status === 'approved')
          .map(approval => approval.approver_id)
      })
      .eq('id', changeId);
      
    await createChangeHistory(
      changeId,
      'status_changed',
      { 
        from: 'approval',
        to: 'scheduled',
        reason: 'All required approvals received'
      }
    );
  }
};

/**
 * Creates a change schedule
 */
export const getChangeSchedule = async (changeId: string) => {
  const { data, error } = await supabase
    .from('change_schedules')
    .select('*')
    .eq('change_id', changeId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
    throw error;
  }

  return data || null;
};

export const createChangeSchedule = async (
  changeId: string,
  scheduleData: {
    scheduled_start: string;
    scheduled_end: string;
    maintenance_window?: boolean;
  }
) => {
  const { data: userData } = await supabase.auth.getUser();
  
  // Get the user's tenant_id
  const { data: userDetails } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();

  const newSchedule = {
    change_id: changeId,
    scheduled_start: scheduleData.scheduled_start,
    scheduled_end: scheduleData.scheduled_end,
    maintenance_window: scheduleData.maintenance_window || false,
    notification_sent: false,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('change_schedules')
    .insert(newSchedule)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entry
  await createChangeHistory(
    changeId,
    'scheduled',
    { 
      scheduled_start: scheduleData.scheduled_start,
      scheduled_end: scheduleData.scheduled_end,
      maintenance_window: scheduleData.maintenance_window
    }
  );

  return data;
};

/**
 * Updates a change schedule
 */
export const updateChangeSchedule = async (
  scheduleIdOrChangeId: string,
  scheduleData: {
    change_id?: string;
    planned_start_date?: string | null;
    planned_end_date?: string | null;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    scheduled_start?: string;
    scheduled_end?: string;
    maintenance_window?: boolean;
    notification_sent?: boolean;
  }
) => {
  // Check if we're dealing with a schedule ID or a change ID
  const isChangeId = scheduleData.change_id !== undefined;
  
  if (isChangeId) {
    // First check if a schedule exists for this change
    const { data: existingSchedule } = await supabase
      .from('change_schedules')
      .select('id')
      .eq('change_id', scheduleIdOrChangeId)
      .single();
    
    if (existingSchedule) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('change_schedules')
        .update({
          scheduled_start: scheduleData.planned_start_date || scheduleData.scheduled_start,
          scheduled_end: scheduleData.planned_end_date || scheduleData.scheduled_end,
          actual_start: scheduleData.actual_start_date,
          actual_end: scheduleData.actual_end_date,
          maintenance_window: scheduleData.maintenance_window,
          notification_sent: scheduleData.notification_sent,
          updated_at: new Date().toISOString()
        })
        .eq('change_id', scheduleIdOrChangeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new schedule
      const { data, error } = await supabase
        .from('change_schedules')
        .insert({
          change_id: scheduleIdOrChangeId,
          scheduled_start: scheduleData.planned_start_date || scheduleData.scheduled_start,
          scheduled_end: scheduleData.planned_end_date || scheduleData.scheduled_end,
          actual_start: scheduleData.actual_start_date,
          actual_end: scheduleData.actual_end_date,
          maintenance_window: scheduleData.maintenance_window || false,
          notification_sent: scheduleData.notification_sent || false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } else {
    // Original implementation for schedule ID
    const { data, error } = await supabase
      .from('change_schedules')
      .update({
        scheduled_start: scheduleData.scheduled_start,
        scheduled_end: scheduleData.scheduled_end,
        maintenance_window: scheduleData.maintenance_window,
        notification_sent: scheduleData.notification_sent,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleIdOrChangeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const getChangeHistory = async (changeId: string) => {
  const { data, error } = await supabase
    .from('change_history')
    .select('*')
    .eq('change_id', changeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getChangeApprovals = async (changeId: string) => {
  const { data, error } = await supabase
    .from('change_approvals')
    .select('*')
    .eq('change_id', changeId);

  if (error) throw error;
  return data || [];
};

export const createChangeApproval = async (approvalData: {
  change_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string | null;
}) => {
  const { data, error } = await supabase
    .from('change_approvals')
    .insert({
      ...approvalData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateChangeApproval = async (
  approvalId: string,
  approvalData: {
    status: 'pending' | 'approved' | 'rejected';
    comments?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from('change_approvals')
    .update({
      ...approvalData,
      updated_at: new Date().toISOString()
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChangeTicketLinks = async (changeId: string) => {
  const { data, error } = await supabase
    .from('change_ticket_links')
    .select('*')
    .eq('change_id', changeId);

  if (error) throw error;
  return data || [];
};

export const getChangeProblemLinks = async (changeId: string) => {
  const { data, error } = await supabase
    .from('change_problem_links')
    .select('*')
    .eq('change_id', changeId);

  if (error) throw error;
  return data || [];
};

export const linkChangeToTicket = async (changeId: string, ticketId: string) => {
  const { data, error } = await supabase
    .from('change_ticket_links')
    .insert({
      change_id: changeId,
      ticket_id: ticketId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const linkChangeToProblem = async (changeId: string, problemId: string) => {
  const { data, error } = await supabase
    .from('change_problem_links')
    .insert({
      change_id: changeId,
      problem_id: problemId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unlinkChangeFromTicket = async (linkId: string) => {
  const { error } = await supabase
    .from('change_ticket_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
  return true;
};

export const unlinkChangeFromProblem = async (linkId: string) => {
  const { error } = await supabase
    .from('change_problem_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
  return true;
};

// Original implementation
export const updateChangeSchedule_original = async (
  scheduleId: string,
  scheduleData: {
    scheduled_start?: string;
    scheduled_end?: string;
    maintenance_window?: boolean;
    notification_sent?: boolean;
  }
) => {
  const { data: schedule } = await supabase
    .from('change_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  const { data, error } = await supabase
    .from('change_schedules')
    .update(scheduleData)
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entry if dates changed
  if (scheduleData.scheduled_start !== schedule.scheduled_start || 
      scheduleData.scheduled_end !== schedule.scheduled_end) {
    await createChangeHistory(
      schedule.change_id,
      'schedule_updated',
      { 
        from: {
          scheduled_start: schedule.scheduled_start,
          scheduled_end: schedule.scheduled_end
        },
        to: {
          scheduled_start: scheduleData.scheduled_start || schedule.scheduled_start,
          scheduled_end: scheduleData.scheduled_end || schedule.scheduled_end
        }
      }
    );
  }

  return data;
};

/**
 * Links a ticket to a change
 */
export const linkTicketToChange = async (changeId: string, ticketId: string, userId: string) => {
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
    .from('change_ticket_links')
    .select('id')
    .eq('change_id', changeId)
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (existingLink) {
    return existingLink; // Link already exists
  }

  const linkData = {
    change_id: changeId,
    ticket_id: ticketId,
    created_by: userId,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('change_ticket_links')
    .insert(linkData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both change and ticket
  await createChangeHistory(
    changeId,
    'linked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'linked_to_change',
    { change_id: changeId }
  );

  return data;
};

/**
 * Unlinks a ticket from a change
 */
export const unlinkTicketFromChange = async (changeId: string, ticketId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('change_ticket_links')
    .delete()
    .eq('change_id', changeId)
    .eq('ticket_id', ticketId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both change and ticket
  await createChangeHistory(
    changeId,
    'unlinked_ticket',
    { ticket_id: ticketId }
  );

  await createTicketHistory(
    ticketId,
    'unlinked_from_change',
    { change_id: changeId }
  );

  return data;
};

/**
 * Links a problem to a change
 */
export const linkProblemToChange = async (changeId: string, problemId: string, userId: string) => {
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
    .from('change_problem_links')
    .select('id')
    .eq('change_id', changeId)
    .eq('problem_id', problemId)
    .maybeSingle();

  if (existingLink) {
    return existingLink; // Link already exists
  }

  const linkData = {
    change_id: changeId,
    problem_id: problemId,
    created_by: userId,
    tenant_id: userDetails.tenant_id
  };

  const { data, error } = await supabase
    .from('change_problem_links')
    .insert(linkData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both change and problem
  await createChangeHistory(
    changeId,
    'linked_problem',
    { problem_id: problemId }
  );

  await createProblemHistory(
    problemId,
    'linked_to_change',
    { change_id: changeId }
  );

  return data;
};

/**
 * Unlinks a problem from a change
 */
export const unlinkProblemFromChange = async (changeId: string, problemId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('change_problem_links')
    .delete()
    .eq('change_id', changeId)
    .eq('problem_id', problemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create history entries for both change and problem
  await createChangeHistory(
    changeId,
    'unlinked_problem',
    { problem_id: problemId }
  );

  await createProblemHistory(
    problemId,
    'unlinked_from_change',
    { change_id: changeId }
  );

  return data;
};

/**
 * Gets change statistics
 */
export const getChangeStats = async () => {
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
    .from('changes')
    .select('status, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('status');

  if (statusError) {
    throw statusError;
  }

  // Get counts by change type
  const { data: typeCounts, error: typeError } = await supabase
    .from('changes')
    .select('change_type, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('change_type');

  if (typeError) {
    throw typeError;
  }

  // Get counts by risk level
  const { data: riskCounts, error: riskError } = await supabase
    .from('changes')
    .select('risk_level, count', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .group('risk_level');

  if (riskError) {
    throw riskError;
  }

  // Get total count
  const { count: totalCount, error: totalCountError } = await supabase
    .from('changes')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (totalCountError) {
    throw totalCountError;
  }

  // Get upcoming changes (scheduled but not implemented)
  const { data: upcomingChanges, error: upcomingError } = await supabase
    .from('changes')
    .select(`
      *,
      schedule:change_schedules(scheduled_start, scheduled_end)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'scheduled')
    .order('planned_start_date', { ascending: true })
    .limit(5);

  if (upcomingError) {
    throw upcomingError;
  }

  return {
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    typeCounts: typeCounts.reduce((acc, curr) => {
      acc[curr.change_type] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    riskCounts: riskCounts.reduce((acc, curr) => {
      acc[curr.risk_level] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>),
    totalCount,
    upcomingChanges
  };
};

/**
 * Gets changes related to a specific ticket
 */
export const getChangesForTicket = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('change_ticket_links')
    .select(`
      change_id,
      changes:change_id(*)
    `)
    .eq('ticket_id', ticketId);

  if (error) {
    throw error;
  }

  return data.map(item => item.changes);
};

/**
 * Gets changes related to a specific problem
 */
export const getChangesForProblem = async (problemId: string) => {
  const { data, error } = await supabase
    .from('change_problem_links')
    .select(`
      change_id,
      changes:change_id(*)
    `)
    .eq('problem_id', problemId);

  if (error) {
    throw error;
  }

  return data.map(item => item.changes);
};
