/**
 * Type definitions for the workflow automation module
 */

export type NodeType = 
  | 'trigger' 
  | 'condition' 
  | 'action' 
  | 'delay'
  | 'loop'
  | 'junction';

export type ModuleType =
  | 'tickets'
  | 'problems'
  | 'changes'
  | 'improvements'
  | 'knowledge'
  | 'service_catalog'
  | 'users'
  | 'notifications'
  | 'external';

export type TriggerType =
  | 'record_created'
  | 'record_updated'
  | 'field_changed'
  | 'status_changed'
  | 'assignment_changed'
  | 'comment_added'
  | 'scheduled'
  | 'form_submitted'
  | 'webhook';

export type ConditionType =
  | 'field_equals'
  | 'field_not_equals'
  | 'field_contains'
  | 'field_not_contains'
  | 'field_greater_than'
  | 'field_less_than'
  | 'field_is_empty'
  | 'field_is_not_empty'
  | 'user_is'
  | 'user_in_group'
  | 'status_is'
  | 'priority_is'
  | 'custom_expression';

export type ActionType =
  | 'update_field'
  | 'update_status'
  | 'assign_to'
  | 'add_comment'
  | 'create_record'
  | 'send_email'
  | 'send_notification'
  | 'create_task'
  | 'webhook_request'
  | 'run_script';

export type DelayType =
  | 'fixed_time'
  | 'business_hours'
  | 'until_date'
  | 'until_condition';

export type JunctionType =
  | 'and'
  | 'or'
  | 'split'
  | 'merge';

export type ConnectionType =
  | 'standard'
  | 'conditional_true'
  | 'conditional_false'
  | 'loop_complete'
  | 'loop_exit';

export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'archived';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  moduleType?: ModuleType;
  label: string;
  description?: string;
  position: NodePosition;
  config: any;
  style?: any;
}

export interface TriggerNode extends WorkflowNode {
  type: 'trigger';
  triggerType: TriggerType;
  config: {
    module: ModuleType;
    conditions?: any[];
    schedule?: {
      frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly';
      time?: string;
      day?: number;
      date?: string;
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
    };
  };
}

export interface ConditionNode extends WorkflowNode {
  type: 'condition';
  conditionType: ConditionType;
  config: {
    field?: string;
    operator?: string;
    value?: any;
    expression?: string;
    user?: string;
    group?: string;
    status?: string;
    priority?: string;
  };
}

export interface ActionNode extends WorkflowNode {
  type: 'action';
  actionType: ActionType;
  config: {
    module: ModuleType;
    field?: string;
    value?: any;
    template?: string;
    user?: string;
    group?: string;
    status?: string;
    priority?: string;
    recordType?: string;
    recordData?: any;
    email?: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      attachments?: string[];
    };
    notification?: {
      users: string[];
      message: string;
      link?: string;
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    };
    script?: string;
  };
}

export interface DelayNode extends WorkflowNode {
  type: 'delay';
  delayType: DelayType;
  config: {
    duration?: number; // in minutes
    businessHours?: boolean;
    until?: {
      date?: string;
      time?: string;
      condition?: any;
    };
  };
}

export interface LoopNode extends WorkflowNode {
  type: 'loop';
  config: {
    collection: string;
    variable: string;
    maxIterations?: number;
  };
}

export interface JunctionNode extends WorkflowNode {
  type: 'junction';
  junctionType: JunctionType;
  config: {
    branches?: number;
  };
}

export interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  label?: string;
  condition?: any;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  module: ModuleType;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
  version: number;
  is_template?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_id: string;
  status: ExecutionStatus;
  context: any;
  started_at: string;
  completed_at?: string;
  error?: string;
  logs: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  id: string;
  execution_id: string;
  node_id: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  data?: any;
  timestamp: string;
}
