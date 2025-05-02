import { supabase } from '../lib/supabaseClient';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowExecution, 
  WorkflowExecutionLog,
  WorkflowExecutionStatus,
  WorkflowVariable,
  NodeType,
  TriggerNode,
  ConditionNode,
  ActionNode,
  DelayNode,
  LoopNode,
  JunctionNode,
  ModuleType
} from '../types/workflowAutomation';

/**
 * Workflow Execution Engine
 * 
 * This service handles the actual execution of workflows, processing nodes
 * in the correct order based on connections, evaluating conditions, and
 * performing actions.
 */

// Context object passed through the workflow execution
interface ExecutionContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  userId: string;
  variables: Record<string, any>;
  moduleType: ModuleType;
  moduleItemId?: string;
  logs: WorkflowExecutionLog[];
  visitedNodes: Set<string>;
  currentPath: string[];
  loopCounters: Record<string, number>;
  delayTimers: Record<string, NodeJS.Timeout>;
  status: WorkflowExecutionStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

/**
 * Start a workflow execution based on a trigger
 */
export const executeWorkflow = async (
  workflowId: string,
  triggerData: Record<string, any>,
  moduleType: ModuleType,
  moduleItemId?: string
): Promise<string> => {
  try {
    // Get the workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();
      
    if (error || !workflow) {
      throw new Error(`Workflow not found: ${error?.message || 'Unknown error'}`);
    }
    
    // Parse the workflow data
    const parsedWorkflow: Workflow = {
      ...workflow,
      nodes: JSON.parse(workflow.nodes || '[]'),
      connections: JSON.parse(workflow.connections || '[]'),
      variables: JSON.parse(workflow.variables || '[]')
    };
    
    // Create a new execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        tenant_id: parsedWorkflow.tenant_id,
        status: 'running',
        started_at: new Date().toISOString(),
        trigger_data: triggerData,
        module_type: moduleType,
        module_item_id: moduleItemId
      })
      .select()
      .single();
      
    if (execError || !execution) {
      throw new Error(`Failed to create execution: ${execError?.message || 'Unknown error'}`);
    }
    
    // Initialize execution context
    const context: ExecutionContext = {
      workflowId,
      executionId: execution.id,
      tenantId: parsedWorkflow.tenant_id,
      userId: triggerData.userId || '',
      variables: initializeVariables(parsedWorkflow.variables, triggerData),
      moduleType,
      moduleItemId,
      logs: [],
      visitedNodes: new Set<string>(),
      currentPath: [],
      loopCounters: {},
      delayTimers: {},
      status: 'running',
      startTime: new Date()
    };
    
    // Find the trigger node
    const triggerNode = parsedWorkflow.nodes.find(node => node.type === 'trigger') as TriggerNode;
    
    if (!triggerNode) {
      await logExecution(context, 'error', 'No trigger node found in workflow');
      await completeExecution(context, 'failed', 'No trigger node found in workflow');
      return execution.id;
    }
    
    // Start execution from the trigger node
    await processNode(parsedWorkflow, triggerNode.id, context);
    
    return execution.id;
  } catch (error) {
    console.error('Workflow execution error:', error);
    throw error;
  }
};

/**
 * Process a node in the workflow
 */
const processNode = async (
  workflow: Workflow,
  nodeId: string,
  context: ExecutionContext
): Promise<void> => {
  // Check if we've already visited this node (prevent infinite loops)
  if (context.visitedNodes.has(nodeId) && !isLoopNode(workflow, nodeId)) {
    await logExecution(context, 'warning', `Skipping already visited node: ${nodeId}`);
    return;
  }
  
  // Mark node as visited
  context.visitedNodes.add(nodeId);
  context.currentPath.push(nodeId);
  
  // Find the node
  const node = workflow.nodes.find(n => n.id === nodeId);
  
  if (!node) {
    await logExecution(context, 'error', `Node not found: ${nodeId}`);
    return;
  }
  
  await logExecution(context, 'info', `Processing node: ${node.type} - ${node.id}`);
  
  try {
    // Process based on node type
    switch (node.type) {
      case 'trigger':
        await processTriggerNode(workflow, node as TriggerNode, context);
        break;
      case 'condition':
        await processConditionNode(workflow, node as ConditionNode, context);
        break;
      case 'action':
        await processActionNode(workflow, node as ActionNode, context);
        break;
      case 'delay':
        await processDelayNode(workflow, node as DelayNode, context);
        break;
      case 'loop':
        await processLoopNode(workflow, node as LoopNode, context);
        break;
      case 'junction':
        await processJunctionNode(workflow, node as JunctionNode, context);
        break;
      default:
        await logExecution(context, 'error', `Unknown node type: ${node.type}`);
    }
  } catch (error) {
    await logExecution(context, 'error', `Error processing node ${nodeId}: ${error.message}`);
    await completeExecution(context, 'failed', error.message);
  }
};

/**
 * Process a trigger node
 */
const processTriggerNode = async (
  workflow: Workflow,
  node: TriggerNode,
  context: ExecutionContext
): Promise<void> => {
  await logExecution(context, 'info', `Trigger activated: ${node.triggerType}`);
  
  // Find outgoing connections
  const outgoingConnections = workflow.connections.filter(conn => conn.sourceId === node.id);
  
  // Follow each connection
  for (const connection of outgoingConnections) {
    await processNode(workflow, connection.targetId, context);
  }
};

/**
 * Process a condition node
 */
const processConditionNode = async (
  workflow: Workflow,
  node: ConditionNode,
  context: ExecutionContext
): Promise<void> => {
  // Evaluate the condition
  const conditionResult = evaluateCondition(node.condition, context.variables);
  
  await logExecution(
    context, 
    'info', 
    `Condition evaluated: ${JSON.stringify(node.condition)} = ${conditionResult}`
  );
  
  // Find outgoing connections
  const outgoingConnections = workflow.connections.filter(conn => conn.sourceId === node.id);
  
  // Follow the appropriate connection based on condition result
  const nextConnection = outgoingConnections.find(conn => 
    (conditionResult && conn.label === 'true') || (!conditionResult && conn.label === 'false')
  );
  
  if (nextConnection) {
    await processNode(workflow, nextConnection.targetId, context);
  } else {
    await logExecution(context, 'warning', `No matching connection found for condition result: ${conditionResult}`);
  }
};

/**
 * Process an action node
 */
const processActionNode = async (
  workflow: Workflow,
  node: ActionNode,
  context: ExecutionContext
): Promise<void> => {
  try {
    // Execute the action
    await executeAction(node, context);
    
    // Find outgoing connections
    const outgoingConnections = workflow.connections.filter(conn => conn.sourceId === node.id);
    
    // Follow each connection
    for (const connection of outgoingConnections) {
      await processNode(workflow, connection.targetId, context);
    }
  } catch (error) {
    await logExecution(context, 'error', `Action execution failed: ${error.message}`);
    throw error;
  }
};

/**
 * Process a delay node
 */
const processDelayNode = async (
  workflow: Workflow,
  node: DelayNode,
  context: ExecutionContext
): Promise<void> => {
  const delayMs = calculateDelayMs(node, context.variables);
  
  await logExecution(context, 'info', `Delay started: ${delayMs}ms`);
  
  // Store the execution state in the database
  await supabase
    .from('workflow_execution_state')
    .insert({
      execution_id: context.executionId,
      node_id: node.id,
      resume_at: new Date(Date.now() + delayMs).toISOString(),
      context: JSON.stringify(context)
    });
  
  // In a real implementation, this would be handled by a scheduler
  // For now, we'll use setTimeout for demonstration
  const timer = setTimeout(async () => {
    await logExecution(context, 'info', `Delay completed: ${delayMs}ms`);
    
    // Find outgoing connections
    const outgoingConnections = workflow.connections.filter(conn => conn.sourceId === node.id);
    
    // Follow each connection
    for (const connection of outgoingConnections) {
      await processNode(workflow, connection.targetId, context);
    }
    
    // Remove the execution state
    await supabase
      .from('workflow_execution_state')
      .delete()
      .eq('execution_id', context.executionId)
      .eq('node_id', node.id);
      
  }, delayMs);
  
  // Store the timer reference
  context.delayTimers[node.id] = timer;
};

/**
 * Process a loop node
 */
const processLoopNode = async (
  workflow: Workflow,
  node: LoopNode,
  context: ExecutionContext
): Promise<void> => {
  // Initialize loop counter if not exists
  if (context.loopCounters[node.id] === undefined) {
    context.loopCounters[node.id] = 0;
  }
  
  // Increment loop counter
  context.loopCounters[node.id]++;
  
  await logExecution(
    context, 
    'info', 
    `Loop iteration ${context.loopCounters[node.id]}/${node.iterations || 'infinite'}`
  );
  
  // Check if we've reached the maximum iterations
  if (node.iterations && context.loopCounters[node.id] > node.iterations) {
    await logExecution(context, 'info', `Loop completed after ${node.iterations} iterations`);
    
    // Find the exit connection
    const exitConnection = workflow.connections.find(
      conn => conn.sourceId === node.id && conn.label === 'exit'
    );
    
    if (exitConnection) {
      await processNode(workflow, exitConnection.targetId, context);
    }
    
    return;
  }
  
  // Find the loop body connection
  const bodyConnection = workflow.connections.find(
    conn => conn.sourceId === node.id && conn.label === 'body'
  );
  
  if (bodyConnection) {
    await processNode(workflow, bodyConnection.targetId, context);
    
    // After processing the body, return to this node to continue the loop
    // We need to remove this node from visitedNodes to allow revisiting
    context.visitedNodes.delete(node.id);
    await processNode(workflow, node.id, context);
  } else {
    await logExecution(context, 'warning', 'No body connection found for loop node');
  }
};

/**
 * Process a junction node
 */
const processJunctionNode = async (
  workflow: Workflow,
  node: JunctionNode,
  context: ExecutionContext
): Promise<void> => {
  await logExecution(context, 'info', `Junction node: ${node.junctionType}`);
  
  // Find outgoing connections
  const outgoingConnections = workflow.connections.filter(conn => conn.sourceId === node.id);
  
  // Follow each connection
  for (const connection of outgoingConnections) {
    await processNode(workflow, connection.targetId, context);
  }
};

/**
 * Execute an action based on its type
 */
const executeAction = async (
  node: ActionNode,
  context: ExecutionContext
): Promise<void> => {
  const { actionType, config } = node;
  
  await logExecution(context, 'info', `Executing action: ${actionType}`);
  
  switch (actionType) {
    case 'update_ticket':
      await executeUpdateTicket(config, context);
      break;
    case 'create_ticket':
      await executeCreateTicket(config, context);
      break;
    case 'assign_ticket':
      await executeAssignTicket(config, context);
      break;
    case 'send_notification':
      await executeSendNotification(config, context);
      break;
    case 'create_knowledge_article':
      await executeCreateKnowledgeArticle(config, context);
      break;
    case 'set_variable':
      executeSetVariable(config, context);
      break;
    case 'http_request':
      await executeHttpRequest(config, context);
      break;
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};

/**
 * Update a ticket
 */
const executeUpdateTicket = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const ticketId = replaceVariables(config.ticketId, context.variables) || context.moduleItemId;
  
  if (!ticketId) {
    throw new Error('No ticket ID provided for update_ticket action');
  }
  
  const updateData: Record<string, any> = {};
  
  if (config.status) {
    updateData.status = replaceVariables(config.status, context.variables);
  }
  
  if (config.priority) {
    updateData.priority = replaceVariables(config.priority, context.variables);
  }
  
  if (config.category) {
    updateData.category = replaceVariables(config.category, context.variables);
  }
  
  if (config.description) {
    updateData.description = replaceVariables(config.description, context.variables);
  }
  
  // Update the ticket in the database
  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId);
    
  if (error) {
    throw new Error(`Failed to update ticket: ${error.message}`);
  }
  
  await logExecution(
    context, 
    'info', 
    `Updated ticket ${ticketId} with data: ${JSON.stringify(updateData)}`
  );
};

/**
 * Create a ticket
 */
const executeCreateTicket = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const ticketData = {
    tenant_id: context.tenantId,
    title: replaceVariables(config.title, context.variables),
    description: replaceVariables(config.description, context.variables),
    status: replaceVariables(config.status, context.variables) || 'open',
    priority: replaceVariables(config.priority, context.variables) || 'medium',
    category: replaceVariables(config.category, context.variables),
    created_by: context.userId,
    assigned_to: replaceVariables(config.assignedTo, context.variables)
  };
  
  // Create the ticket in the database
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }
  
  // Store the created ticket ID in variables
  context.variables['createdTicketId'] = data.id;
  
  await logExecution(
    context, 
    'info', 
    `Created ticket with ID ${data.id}: ${ticketData.title}`
  );
};

/**
 * Assign a ticket
 */
const executeAssignTicket = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const ticketId = replaceVariables(config.ticketId, context.variables) || context.moduleItemId;
  const assigneeId = replaceVariables(config.assigneeId, context.variables);
  
  if (!ticketId) {
    throw new Error('No ticket ID provided for assign_ticket action');
  }
  
  if (!assigneeId) {
    throw new Error('No assignee ID provided for assign_ticket action');
  }
  
  // Update the ticket in the database
  const { error } = await supabase
    .from('tickets')
    .update({ assigned_to: assigneeId })
    .eq('id', ticketId);
    
  if (error) {
    throw new Error(`Failed to assign ticket: ${error.message}`);
  }
  
  await logExecution(
    context, 
    'info', 
    `Assigned ticket ${ticketId} to user ${assigneeId}`
  );
};

/**
 * Send a notification
 */
const executeSendNotification = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const recipients = Array.isArray(config.recipients) 
    ? config.recipients.map(r => replaceVariables(r, context.variables))
    : [replaceVariables(config.recipients, context.variables)];
    
  const notification = {
    tenant_id: context.tenantId,
    title: replaceVariables(config.title, context.variables),
    message: replaceVariables(config.message, context.variables),
    recipients: recipients,
    type: config.notificationType || 'system',
    created_by: context.userId,
    module_type: context.moduleType,
    module_item_id: context.moduleItemId
  };
  
  // Create the notification in the database
  const { error } = await supabase
    .from('notifications')
    .insert(notification);
    
  if (error) {
    throw new Error(`Failed to send notification: ${error.message}`);
  }
  
  await logExecution(
    context, 
    'info', 
    `Sent ${notification.type} notification to ${recipients.join(', ')}: ${notification.title}`
  );
};

/**
 * Create a knowledge article
 */
const executeCreateKnowledgeArticle = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const article = {
    tenant_id: context.tenantId,
    title: replaceVariables(config.title, context.variables),
    content: replaceVariables(config.content, context.variables),
    category_id: replaceVariables(config.categoryId, context.variables),
    status: replaceVariables(config.status, context.variables) || 'draft',
    created_by: context.userId
  };
  
  // Create the article in the database
  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert(article)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create knowledge article: ${error.message}`);
  }
  
  // Store the created article ID in variables
  context.variables['createdArticleId'] = data.id;
  
  await logExecution(
    context, 
    'info', 
    `Created knowledge article with ID ${data.id}: ${article.title}`
  );
};

/**
 * Set a workflow variable
 */
const executeSetVariable = (
  config: Record<string, any>,
  context: ExecutionContext
): void => {
  const variableName = config.name;
  const variableValue = evaluateExpression(config.value, context.variables);
  
  if (!variableName) {
    throw new Error('No variable name provided for set_variable action');
  }
  
  // Set the variable
  context.variables[variableName] = variableValue;
  
  logExecution(
    context, 
    'info', 
    `Set variable ${variableName} = ${JSON.stringify(variableValue)}`
  );
};

/**
 * Execute an HTTP request
 */
const executeHttpRequest = async (
  config: Record<string, any>,
  context: ExecutionContext
): Promise<void> => {
  const url = replaceVariables(config.url, context.variables);
  const method = (config.method || 'GET').toUpperCase();
  const headers = config.headers || {};
  const body = config.body ? replaceVariables(config.body, context.variables) : undefined;
  
  // Replace variables in headers
  Object.keys(headers).forEach(key => {
    headers[key] = replaceVariables(headers[key], context.variables);
  });
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined
    });
    
    const responseData = await response.json().catch(() => null);
    
    // Store the response in variables
    context.variables['httpResponse'] = {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
    
    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }
    
    await logExecution(
      context, 
      'info', 
      `HTTP ${method} request to ${url} completed with status ${response.status}`
    );
  } catch (error) {
    await logExecution(context, 'error', `HTTP request failed: ${error.message}`);
    throw error;
  }
};

/**
 * Evaluate a condition
 */
const evaluateCondition = (
  condition: Record<string, any>,
  variables: Record<string, any>
): boolean => {
  const { field, operator, value } = condition;
  
  // Get the field value from variables
  const fieldValue = field.startsWith('$') 
    ? variables[field.substring(1)]
    : field;
    
  // Get the comparison value, replacing variables
  const comparisonValue = value.startsWith('$')
    ? variables[value.substring(1)]
    : value;
    
  // Evaluate based on operator
  switch (operator) {
    case 'equals':
      return fieldValue == comparisonValue;
    case 'not_equals':
      return fieldValue != comparisonValue;
    case 'greater_than':
      return fieldValue > comparisonValue;
    case 'less_than':
      return fieldValue < comparisonValue;
    case 'contains':
      return String(fieldValue).includes(String(comparisonValue));
    case 'not_contains':
      return !String(fieldValue).includes(String(comparisonValue));
    case 'starts_with':
      return String(fieldValue).startsWith(String(comparisonValue));
    case 'ends_with':
      return String(fieldValue).endsWith(String(comparisonValue));
    case 'is_empty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    default:
      return false;
  }
};

/**
 * Calculate delay in milliseconds
 */
const calculateDelayMs = (
  node: DelayNode,
  variables: Record<string, any>
): number => {
  const amount = evaluateExpression(node.amount, variables);
  const unit = node.unit || 'minutes';
  
  switch (unit) {
    case 'seconds':
      return amount * 1000;
    case 'minutes':
      return amount * 60 * 1000;
    case 'hours':
      return amount * 60 * 60 * 1000;
    case 'days':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return amount * 60 * 1000; // Default to minutes
  }
};

/**
 * Replace variables in a string
 */
const replaceVariables = (
  str: string,
  variables: Record<string, any>
): string => {
  if (!str || typeof str !== 'string') {
    return str;
  }
  
  return str.replace(/\$([a-zA-Z0-9_]+)/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Evaluate an expression, which could be a variable reference or a literal value
 */
const evaluateExpression = (
  expression: any,
  variables: Record<string, any>
): any => {
  if (typeof expression === 'string' && expression.startsWith('$')) {
    const variableName = expression.substring(1);
    return variables[variableName];
  }
  
  return expression;
};

/**
 * Initialize workflow variables with default values and trigger data
 */
const initializeVariables = (
  variables: WorkflowVariable[],
  triggerData: Record<string, any>
): Record<string, any> => {
  const result: Record<string, any> = { ...triggerData };
  
  variables.forEach(variable => {
    if (result[variable.name] === undefined && variable.defaultValue !== undefined) {
      result[variable.name] = variable.defaultValue;
    }
  });
  
  return result;
};

/**
 * Log an execution event
 */
const logExecution = async (
  context: ExecutionContext,
  level: 'info' | 'warning' | 'error',
  message: string
): Promise<void> => {
  const log: WorkflowExecutionLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    node_id: context.currentPath[context.currentPath.length - 1] || '',
    execution_path: [...context.currentPath]
  };
  
  // Add to in-memory logs
  context.logs.push(log);
  
  // Persist to database
  await supabase
    .from('workflow_execution_logs')
    .insert({
      execution_id: context.executionId,
      tenant_id: context.tenantId,
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      node_id: log.node_id,
      execution_path: log.execution_path
    });
};

/**
 * Complete a workflow execution
 */
const completeExecution = async (
  context: ExecutionContext,
  status: WorkflowExecutionStatus,
  error?: string
): Promise<void> => {
  // Update context
  context.status = status;
  context.endTime = new Date();
  context.error = error;
  
  // Clean up any pending timers
  Object.values(context.delayTimers).forEach(timer => clearTimeout(timer));
  
  // Update the execution record
  await supabase
    .from('workflow_executions')
    .update({
      status,
      completed_at: context.endTime.toISOString(),
      error: error || null,
      execution_time_ms: context.endTime.getTime() - context.startTime.getTime()
    })
    .eq('id', context.executionId);
    
  await logExecution(
    context, 
    status === 'completed' ? 'info' : 'error',
    `Workflow execution ${status}${error ? `: ${error}` : ''}`
  );
};

/**
 * Check if a node is a loop node
 */
const isLoopNode = (workflow: Workflow, nodeId: string): boolean => {
  const node = workflow.nodes.find(n => n.id === nodeId);
  return node?.type === 'loop';
};

/**
 * Trigger a workflow based on an event
 */
export const triggerWorkflow = async (
  moduleType: ModuleType,
  triggerType: string,
  triggerData: Record<string, any>,
  moduleItemId?: string
): Promise<string[]> => {
  try {
    // Find workflows that match the trigger
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('module_type', moduleType)
      .eq('status', 'active');
      
    if (error) {
      throw new Error(`Failed to find workflows: ${error.message}`);
    }
    
    const executionIds: string[] = [];
    
    // Parse workflows and check if they have a matching trigger
    for (const workflow of workflows) {
      const parsedWorkflow: Workflow = {
        ...workflow,
        nodes: JSON.parse(workflow.nodes || '[]'),
        connections: JSON.parse(workflow.connections || '[]'),
        variables: JSON.parse(workflow.variables || '[]')
      };
      
      // Find trigger nodes that match the trigger type
      const triggerNode = parsedWorkflow.nodes.find(
        node => node.type === 'trigger' && (node as TriggerNode).triggerType === triggerType
      );
      
      if (triggerNode) {
        // Execute the workflow
        const executionId = await executeWorkflow(
          parsedWorkflow.id,
          triggerData,
          moduleType,
          moduleItemId
        );
        
        executionIds.push(executionId);
      }
    }
    
    return executionIds;
  } catch (error) {
    console.error('Workflow trigger error:', error);
    throw error;
  }
};
