import { supabase } from '../lib/supabase';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowExecution,
  WorkflowStatus,
  ModuleType,
  WorkflowExecutionLog
} from '../types/workflowAutomation';

/**
 * Fetch all workflows for the current tenant
 */
export const getWorkflows = async (moduleFilter?: ModuleType, statusFilter?: WorkflowStatus) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Build the query
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('tenant_id', tenant_id);
    
    // Apply filters if provided
    if (moduleFilter) {
      query = query.eq('module', moduleFilter);
    }
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    // Order by updated_at
    query = query.order('updated_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getWorkflows:', error);
    throw error;
  }
};

/**
 * Fetch a single workflow by ID
 * @param id The ID of the workflow
 */
export const getWorkflow = async (id: string) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Fetch the workflow
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Workflow not found with ID: ${id}`);
    }
    
    return data as Workflow;
  } catch (error) {
    console.error('Error in getWorkflow:', error);
    throw error;
  }
};

/**
 * Create a new workflow
 * @param workflow The workflow to create
 */
export const createWorkflow = async (workflow: Partial<Workflow>) => {
  try {
    // Get the current user's tenant_id and user_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    // Check if user has admin or manager role
    if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
      console.error('User does not have required role');
      throw new Error('You must be an admin or manager to create workflows');
    }
    
    const tenant_id = userDetails.tenant_id;
    const user_id = userData.user.id;
    
    // Prepare workflow data
    const workflowData = {
      ...workflow,
      tenant_id,
      created_by: user_id,
      created_at: new Date().toISOString(),
      updated_by: user_id,
      updated_at: new Date().toISOString(),
      version: 1,
      status: workflow.status || 'draft'
    };
    
    // Create the workflow
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();
    
    if (error) {
      console.error('Create error:', error);
      throw error;
    }
    
    return data as Workflow;
  } catch (error) {
    console.error('Error in createWorkflow:', error);
    throw error;
  }
};

/**
 * Update an existing workflow
 * @param id The ID of the workflow to update
 * @param workflow The updated workflow data
 */
export const updateWorkflow = async (id: string, workflow: Partial<Workflow>) => {
  try {
    // Get the current user's tenant_id and user_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    // Check if user has admin or manager role
    if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
      console.error('User does not have required role');
      throw new Error('You must be an admin or manager to update workflows');
    }
    
    const tenant_id = userDetails.tenant_id;
    const user_id = userData.user.id;
    
    // Check if the workflow exists and belongs to the tenant
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('version')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Error fetching workflow: ${fetchError.message}`);
    }
    
    if (!existingWorkflow) {
      throw new Error(`Workflow not found with ID: ${id}`);
    }
    
    // Prepare workflow data for update
    const workflowData = {
      ...workflow,
      updated_by: user_id,
      updated_at: new Date().toISOString(),
      version: (existingWorkflow.version || 1) + 1
    };
    
    // Update the workflow
    const { data, error } = await supabase
      .from('workflows')
      .update(workflowData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    return data as Workflow;
  } catch (error) {
    console.error('Error in updateWorkflow:', error);
    throw error;
  }
};

/**
 * Delete a workflow
 * @param id The ID of the workflow to delete
 */
export const deleteWorkflow = async (id: string) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', userData.user?.id)
      .single();
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    // Check if user has admin or manager role
    if (userDetails.role !== 'admin' && userDetails.role !== 'manager') {
      console.error('User does not have required role');
      throw new Error('You must be an admin or manager to delete workflows');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Delete the workflow
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id);
    
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteWorkflow:', error);
    throw error;
  }
};

/**
 * Activate or deactivate a workflow
 * @param id The ID of the workflow
 * @param active Whether to activate or deactivate the workflow
 */
export const setWorkflowStatus = async (id: string, status: WorkflowStatus) => {
  try {
    return await updateWorkflow(id, { status });
  } catch (error) {
    console.error('Error in setWorkflowStatus:', error);
    throw error;
  }
};

/**
 * Clone an existing workflow
 * @param id The ID of the workflow to clone
 * @param newName Optional new name for the cloned workflow
 */
export const cloneWorkflow = async (id: string, newName?: string) => {
  try {
    // Get the original workflow
    const originalWorkflow = await getWorkflow(id);
    
    if (!originalWorkflow) {
      throw new Error(`Workflow not found with ID: ${id}`);
    }
    
    // Create a new workflow based on the original
    const clonedWorkflow: Partial<Workflow> = {
      name: newName || `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      module: originalWorkflow.module,
      nodes: originalWorkflow.nodes,
      connections: originalWorkflow.connections,
      variables: originalWorkflow.variables,
      status: 'draft' // Always start as draft
    };
    
    return await createWorkflow(clonedWorkflow);
  } catch (error) {
    console.error('Error in cloneWorkflow:', error);
    throw error;
  }
};

/**
 * Get workflow execution history
 * @param workflowId The ID of the workflow
 * @param limit Maximum number of executions to return
 * @param offset Offset for pagination
 */
export const getWorkflowExecutions = async (workflowId: string, limit = 10, offset = 0) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // First verify the workflow belongs to this tenant
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId)
      .eq('tenant_id', tenant_id)
      .single();
    
    if (workflowError || !workflow) {
      console.error('Workflow error:', workflowError);
      throw new Error(`Workflow not found or access denied: ${workflowId}`);
    }
    
    // Fetch the executions
    const { data, error, count } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    return { 
      executions: data as WorkflowExecution[], 
      total: count || 0 
    };
  } catch (error) {
    console.error('Error in getWorkflowExecutions:', error);
    throw error;
  }
};

/**
 * Get execution details including logs
 * @param executionId The ID of the execution
 */
export const getExecutionDetails = async (executionId: string) => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Fetch the execution
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow:workflow_id(id, name, tenant_id)
      `)
      .eq('id', executionId)
      .single();
    
    if (executionError) {
      console.error('Execution error:', executionError);
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    // Verify the workflow belongs to this tenant
    if (execution.workflow.tenant_id !== tenant_id) {
      throw new Error('Access denied: Execution belongs to a different tenant');
    }
    
    // Fetch the execution logs
    const { data: logs, error: logsError } = await supabase
      .from('workflow_execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('timestamp', { ascending: true });
    
    if (logsError) {
      console.error('Logs error:', logsError);
      throw logsError;
    }
    
    return {
      execution,
      logs: logs || []
    };
  } catch (error) {
    console.error('Error in getExecutionDetails:', error);
    throw error;
  }
};

/**
 * Manually trigger a workflow
 * @param workflowId The ID of the workflow to trigger
 * @param context Optional context data for the workflow
 */
export const triggerWorkflow = async (workflowId: string, context: any = {}) => {
  try {
    // Get the current user's tenant_id and user_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user role: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    const user_id = userData.user.id;
    
    // Verify the workflow exists, is active, and belongs to this tenant
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('tenant_id', tenant_id)
      .eq('status', 'active')
      .single();
    
    if (workflowError || !workflow) {
      console.error('Workflow error:', workflowError);
      throw new Error(`Workflow not found, inactive, or access denied: ${workflowId}`);
    }
    
    // Find the trigger node
    const triggerNode = workflow.nodes.find(node => node.type === 'trigger');
    
    if (!triggerNode) {
      throw new Error('Workflow has no trigger node');
    }
    
    // Create a new execution record
    const executionData = {
      workflow_id: workflowId,
      trigger_id: triggerNode.id,
      status: 'pending',
      context: {
        ...context,
        triggered_by: user_id,
        triggered_at: new Date().toISOString()
      },
      started_at: new Date().toISOString()
    };
    
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert(executionData)
      .select()
      .single();
    
    if (executionError) {
      console.error('Execution error:', executionError);
      throw executionError;
    }
    
    // In a real implementation, this would trigger the workflow engine
    // For now, we'll just return the execution record
    return execution;
  } catch (error) {
    console.error('Error in triggerWorkflow:', error);
    throw error;
  }
};

/**
 * Get workflow templates
 */
export const getWorkflowTemplates = async () => {
  try {
    // Fetch public templates
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_public', true)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getWorkflowTemplates:', error);
    throw error;
  }
};

/**
 * Create workflow from template
 * @param templateId The ID of the template
 * @param name Optional name for the new workflow
 */
/**
 * Get execution logs for a workflow execution
 * @param executionId The ID of the execution
 */
export const getWorkflowExecutionLogs = async (executionId: string): Promise<WorkflowExecutionLog[]> => {
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
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
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // First, check if the execution belongs to the user's tenant
    const { data: executionData, error: executionError } = await supabase
      .from('workflow_executions')
      .select('workflow_id')
      .eq('id', executionId)
      .single();
    
    if (executionError) {
      console.error('Execution error:', executionError);
      throw new Error(`Error fetching execution: ${executionError.message}`);
    }
    
    if (!executionData) {
      console.error('No execution found');
      throw new Error('Execution not found');
    }
    
    // Check if the workflow belongs to the user's tenant
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .select('tenant_id')
      .eq('id', executionData.workflow_id)
      .single();
    
    if (workflowError) {
      console.error('Workflow error:', workflowError);
      throw new Error(`Error fetching workflow: ${workflowError.message}`);
    }
    
    if (!workflowData) {
      console.error('No workflow found');
      throw new Error('Workflow not found');
    }
    
    // Ensure the workflow belongs to the user's tenant
    if (workflowData.tenant_id !== tenant_id) {
      console.error('Tenant mismatch');
      throw new Error('You do not have permission to access this execution');
    }
    
    // Fetch the execution logs
    const { data: logs, error: logsError } = await supabase
      .from('workflow_execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('timestamp', { ascending: true });
    
    if (logsError) {
      console.error('Logs error:', logsError);
      throw new Error(`Error fetching execution logs: ${logsError.message}`);
    }
    
    return logs || [];
  } catch (error) {
    console.error('Error in getWorkflowExecutionLogs:', error);
    throw error;
  }
};

export const createWorkflowFromTemplate = async (templateId: string, name?: string) => {
  try {
    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Create a new workflow based on the template
    const workflowData: Partial<Workflow> = {
      name: name || template.name,
      description: template.description,
      module: template.module,
      nodes: template.nodes,
      connections: template.connections,
      variables: template.variables,
      status: 'draft' // Always start as draft
    };
    
    return await createWorkflow(workflowData);
  } catch (error) {
    console.error('Error in createWorkflowFromTemplate:', error);
    throw error;
  }
};
