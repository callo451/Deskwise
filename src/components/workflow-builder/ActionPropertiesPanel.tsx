import React from 'react';
import { Node } from 'reactflow';
import { 
  ActionNode,
  ActionType,
  ModuleType,
  WorkflowVariable
} from '../../types/workflowAutomation';

interface ActionPropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: Partial<ActionNode>) => void;
  variables: WorkflowVariable[];
}

export const ActionPropertiesPanel: React.FC<ActionPropertiesPanelProps> = ({
  node,
  onUpdate,
  variables
}) => {
  const actionType = node.data.actionType || 'update_field';
  
  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { 
      actionType: e.target.value as ActionType,
      config: { ...node.data.config, module: node.data.config?.module || 'tickets' }
    });
  };
  
  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { 
      config: { ...node.data.config, module: e.target.value as ModuleType }
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Action Type
        </label>
        <select
          value={actionType}
          onChange={handleActionTypeChange}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="update_field">Update Field</option>
          <option value="update_status">Update Status</option>
          <option value="assign_to">Assign To</option>
          <option value="add_comment">Add Comment</option>
          <option value="create_record">Create Record</option>
          <option value="send_email">Send Email</option>
          <option value="send_notification">Send Notification</option>
          <option value="create_task">Create Task</option>
          <option value="webhook_request">Webhook Request</option>
          <option value="run_script">Run Script</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Module
        </label>
        <select
          value={node.data.config?.module || 'tickets'}
          onChange={handleModuleChange}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="tickets">Tickets</option>
          <option value="problems">Problems</option>
          <option value="changes">Changes</option>
          <option value="improvements">Improvements</option>
          <option value="knowledge">Knowledge Base</option>
          <option value="service_catalog">Service Catalog</option>
          <option value="users">Users</option>
          <option value="notifications">Notifications</option>
          <option value="external">External</option>
        </select>
      </div>
      
      {/* Render different fields based on action type */}
      {actionType === 'update_field' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field
            </label>
            <input
              type="text"
              value={node.data.config?.field || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, field: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Field name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <input
              type="text"
              value={node.data.config?.value || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, value: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Value or variable (e.g. $ticket.priority)"
            />
          </div>
        </>
      )}
      
      {actionType === 'update_status' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <input
            type="text"
            value={node.data.config?.status || ''}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, status: e.target.value }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="Status ID or name"
          />
        </div>
      )}
      
      {actionType === 'assign_to' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User
          </label>
          <input
            type="text"
            value={node.data.config?.user || ''}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, user: e.target.value }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="User ID or variable"
          />
        </div>
      )}
      
      {actionType === 'add_comment' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            value={node.data.config?.template || ''}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, template: e.target.value }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="Comment text (supports variables with $ prefix)"
            rows={3}
          />
        </div>
      )}
      
      {actionType === 'create_record' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Type
            </label>
            <input
              type="text"
              value={node.data.config?.recordType || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, recordType: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Record type"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Data (JSON)
            </label>
            <textarea
              value={typeof node.data.config?.recordData === 'object' 
                ? JSON.stringify(node.data.config.recordData, null, 2) 
                : node.data.config?.recordData || '{}'}
              onChange={(e) => {
                try {
                  const recordData = JSON.parse(e.target.value);
                  onUpdate(node.id, { 
                    config: { ...node.data.config, recordData }
                  });
                } catch (error) {
                  // If not valid JSON, store as string
                  onUpdate(node.id, { 
                    config: { ...node.data.config, recordData: e.target.value }
                  });
                }
              }}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="{ 'field': 'value' }"
              rows={4}
            />
          </div>
        </>
      )}
      
      {actionType === 'send_email' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              value={Array.isArray(node.data.config?.email?.to) 
                ? node.data.config.email.to.join(', ') 
                : node.data.config?.email?.to || ''}
              onChange={(e) => {
                const to = e.target.value.split(',').map(email => email.trim());
                onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    email: { 
                      ...node.data.config?.email,
                      to
                    } 
                  }
                });
              }}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Email addresses (comma separated)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={node.data.config?.email?.subject || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  email: { 
                    ...node.data.config?.email,
                    subject: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body
            </label>
            <textarea
              value={node.data.config?.email?.body || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  email: { 
                    ...node.data.config?.email,
                    body: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Email body (supports variables with $ prefix)"
              rows={4}
            />
          </div>
        </>
      )}
      
      {actionType === 'send_notification' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Users
            </label>
            <input
              type="text"
              value={Array.isArray(node.data.config?.notification?.users) 
                ? node.data.config.notification.users.join(', ') 
                : node.data.config?.notification?.users || ''}
              onChange={(e) => {
                const users = e.target.value.split(',').map(user => user.trim());
                onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    notification: { 
                      ...node.data.config?.notification,
                      users
                    } 
                  }
                });
              }}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="User IDs or variables (comma separated)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={node.data.config?.notification?.message || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  notification: { 
                    ...node.data.config?.notification,
                    message: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Notification message (supports variables with $ prefix)"
              rows={3}
            />
          </div>
        </>
      )}
      
      {actionType === 'webhook_request' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="text"
              value={node.data.config?.webhook?.url || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  webhook: { 
                    ...node.data.config?.webhook,
                    url: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="https://example.com/api"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              value={node.data.config?.webhook?.method || 'POST'}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  webhook: { 
                    ...node.data.config?.webhook,
                    method: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE'
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body (JSON)
            </label>
            <textarea
              value={typeof node.data.config?.webhook?.body === 'object' 
                ? JSON.stringify(node.data.config.webhook.body, null, 2) 
                : node.data.config?.webhook?.body || '{}'}
              onChange={(e) => {
                try {
                  const body = JSON.parse(e.target.value);
                  onUpdate(node.id, { 
                    config: { 
                      ...node.data.config, 
                      webhook: { 
                        ...node.data.config?.webhook,
                        body
                      } 
                    }
                  });
                } catch (error) {
                  // If not valid JSON, store as string
                  onUpdate(node.id, { 
                    config: { 
                      ...node.data.config, 
                      webhook: { 
                        ...node.data.config?.webhook,
                        body: e.target.value
                      } 
                    }
                  });
                }
              }}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="{ 'field': 'value' }"
              rows={4}
            />
          </div>
        </>
      )}
      
      {actionType === 'run_script' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Script
          </label>
          <textarea
            value={node.data.config?.script || ''}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, script: e.target.value }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="JavaScript code (access variables with $ prefix)"
            rows={6}
          />
        </div>
      )}
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You can use variables in your action by prefixing them with $, e.g. $ticket.id
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPropertiesPanel;
