import { supabase } from '../lib/supabase';
import { SLA, BusinessHours, Holiday, SLAMetric } from '../types/database';

/**
 * Fetch all SLAs for the current tenant
 */
export const fetchSLAs = async (): Promise<SLA[]> => {
  const { data, error } = await supabase
    .from('slas')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching SLAs:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new SLA
 */
export const createSLA = async (sla: Omit<SLA, 'id' | 'created_at' | 'updated_at'>): Promise<SLA> => {
  const { data, error } = await supabase
    .from('slas')
    .insert(sla)
    .select()
    .single();

  if (error) {
    console.error('Error creating SLA:', error);
    throw error;
  }

  return data;
};

/**
 * Update an existing SLA
 */
export const updateSLA = async (id: string, sla: Partial<Omit<SLA, 'id' | 'created_at' | 'updated_at'>>): Promise<SLA> => {
  const { data, error } = await supabase
    .from('slas')
    .update(sla)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating SLA:', error);
    throw error;
  }

  return data;
};

/**
 * Delete an SLA
 */
export const deleteSLA = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('slas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting SLA:', error);
    throw error;
  }
};

/**
 * Fetch all business hours for the current tenant
 */
export const fetchBusinessHours = async (): Promise<BusinessHours[]> => {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week');

  if (error) {
    console.error('Error fetching business hours:', error);
    throw error;
  }

  return data || [];
};

/**
 * Update business hours
 */
export const updateBusinessHours = async (
  id: string, 
  businessHours: Partial<Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>>
): Promise<BusinessHours> => {
  const { data, error } = await supabase
    .from('business_hours')
    .update(businessHours)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating business hours:', error);
    throw error;
  }

  return data;
};

/**
 * Fetch all holidays for the current tenant
 */
export const fetchHolidays = async (): Promise<Holiday[]> => {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('date');

  if (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new holiday
 */
export const createHoliday = async (holiday: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>): Promise<Holiday> => {
  const { data, error } = await supabase
    .from('holidays')
    .insert(holiday)
    .select()
    .single();

  if (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }

  return data;
};

/**
 * Update an existing holiday
 */
export const updateHoliday = async (
  id: string, 
  holiday: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>
): Promise<Holiday> => {
  const { data, error } = await supabase
    .from('holidays')
    .update(holiday)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating holiday:', error);
    throw error;
  }

  return data;
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
};

/**
 * Calculate SLA deadlines for a ticket
 */
export const calculateSLADeadlines = async (
  ticketId: string,
  priorityId: string,
  categoryId: string | null,
  serviceId: string | null,
  createdAt: string
): Promise<{
  slaId: string | null;
  responseDeadline: string | null;
  resolutionDeadline: string | null;
}> => {
  // Get all SLAs for the tenant
  const { data: slas } = await supabase
    .from('slas')
    .select('*')
    .eq('is_active', true);

  if (!slas || slas.length === 0) {
    return {
      slaId: null,
      responseDeadline: null,
      resolutionDeadline: null
    };
  }

  // Get priority details
  const { data: priority } = await supabase
    .from('ticket_priorities')
    .select('*')
    .eq('id', priorityId)
    .single();

  // Find matching SLA
  let matchingSLA = slas.find(sla => {
    // Check if this SLA applies to this priority
    if (sla.applies_to && sla.applies_to.priorities && sla.applies_to.priorities.includes(priorityId)) {
      return true;
    }
    
    // Check if this SLA applies to this category
    if (categoryId && sla.applies_to && sla.applies_to.categories && sla.applies_to.categories.includes(categoryId)) {
      return true;
    }
    
    // Check if this SLA applies to this service
    if (serviceId && sla.applies_to && sla.applies_to.services && sla.applies_to.services.includes(serviceId)) {
      return true;
    }
    
    // If no specific mapping, check if it matches the priority level
    return sla.priority === priority?.name.toLowerCase();
  });

  // If no matching SLA found, use default for the priority
  if (!matchingSLA) {
    matchingSLA = slas.find(sla => sla.priority === priority?.name.toLowerCase());
  }

  // If still no match, use the first active SLA
  if (!matchingSLA) {
    matchingSLA = slas[0];
  }

  // Calculate deadlines
  const createdDate = new Date(createdAt);
  let responseDeadline = null;
  let resolutionDeadline = null;

  if (matchingSLA) {
    if (matchingSLA.business_hours_only) {
      // Complex calculation based on business hours
      // This is a simplified version - a real implementation would need to account for
      // business hours, holidays, etc.
      responseDeadline = new Date(createdDate.getTime() + matchingSLA.response_time_minutes * 60 * 1000).toISOString();
      resolutionDeadline = new Date(createdDate.getTime() + matchingSLA.resolution_time_minutes * 60 * 1000).toISOString();
    } else {
      // Simple calculation for 24/7 SLAs
      responseDeadline = new Date(createdDate.getTime() + matchingSLA.response_time_minutes * 60 * 1000).toISOString();
      resolutionDeadline = new Date(createdDate.getTime() + matchingSLA.resolution_time_minutes * 60 * 1000).toISOString();
    }

    return {
      slaId: matchingSLA.id,
      responseDeadline,
      resolutionDeadline
    };
  }

  return {
    slaId: null,
    responseDeadline: null,
    resolutionDeadline: null
  };
};

/**
 * Update SLA metrics for a ticket
 */
export const updateSLAMetrics = async (
  ticketId: string,
  updates: {
    firstResponseTime?: string | null;
    slaStatus?: string;
  }
): Promise<void> => {
  // Get the ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Update the ticket with SLA information
  const updateData: any = {};
  
  if (updates.firstResponseTime) {
    updateData.first_response_time = updates.firstResponseTime;
    
    // Check if response SLA was met
    if (ticket.response_deadline) {
      const responseDeadline = new Date(ticket.response_deadline);
      const firstResponse = new Date(updates.firstResponseTime);
      
      if (firstResponse > responseDeadline) {
        updateData.sla_status = 'breached';
      }
    }
  }
  
  if (updates.slaStatus) {
    updateData.sla_status = updates.slaStatus;
  }

  // Update the ticket
  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating ticket SLA metrics:', error);
    throw error;
  }

  // Update or create SLA metrics record
  const { data: existingMetric } = await supabase
    .from('sla_metrics')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  const metricData: any = {
    ticket_id: ticketId,
    sla_id: ticket.sla_id,
    response_deadline: ticket.response_deadline,
    resolution_deadline: ticket.resolution_deadline
  };

  if (updates.firstResponseTime) {
    metricData.response_met = new Date(updates.firstResponseTime) <= new Date(ticket.response_deadline || '');
    
    if (!metricData.response_met) {
      metricData.response_breach_time = updates.firstResponseTime;
    }
  }

  if (existingMetric) {
    await supabase
      .from('sla_metrics')
      .update(metricData)
      .eq('id', existingMetric.id);
  } else {
    await supabase
      .from('sla_metrics')
      .insert({
        ...metricData,
        tenant_id: ticket.tenant_id
      });
  }
};

/**
 * Get SLA status for display
 */
export const getSLAStatusDisplay = (
  slaStatus: string | null,
  responseDeadline: string | null,
  resolutionDeadline: string | null,
  firstResponseTime: string | null
): {
  status: 'within' | 'approaching' | 'breached' | 'met' | 'none';
  text: string;
  color: string;
} => {
  if (!slaStatus || !responseDeadline && !resolutionDeadline) {
    return { status: 'none', text: 'No SLA', color: 'gray' };
  }

  if (slaStatus === 'breached') {
    return { status: 'breached', text: 'SLA Breached', color: 'red' };
  }

  if (slaStatus === 'met') {
    return { status: 'met', text: 'SLA Met', color: 'green' };
  }

  const now = new Date();
  
  // Check response deadline
  if (responseDeadline && !firstResponseTime) {
    const deadline = new Date(responseDeadline);
    const timeRemaining = deadline.getTime() - now.getTime();
    const minutesRemaining = timeRemaining / (60 * 1000);
    
    if (timeRemaining < 0) {
      return { status: 'breached', text: 'Response Overdue', color: 'red' };
    }
    
    if (minutesRemaining < 30) {
      return { status: 'approaching', text: 'Response Due Soon', color: 'orange' };
    }
  }
  
  // Check resolution deadline
  if (resolutionDeadline) {
    const deadline = new Date(resolutionDeadline);
    const timeRemaining = deadline.getTime() - now.getTime();
    const minutesRemaining = timeRemaining / (60 * 1000);
    
    if (timeRemaining < 0) {
      return { status: 'breached', text: 'Resolution Overdue', color: 'red' };
    }
    
    if (minutesRemaining < 60) {
      return { status: 'approaching', text: 'Resolution Due Soon', color: 'orange' };
    }
  }
  
  return { status: 'within', text: 'Within SLA', color: 'green' };
};
