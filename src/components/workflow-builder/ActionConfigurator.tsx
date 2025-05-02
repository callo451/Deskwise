import React, { useState, useEffect } from 'react';
import { 
  ModuleType, 
  ActionType 
} from '../../types/workflowAutomation';
import { 
  PencilIcon, 
  EnvelopeIcon, 
  UserIcon, 
  TagIcon,
  DocumentTextIcon,
  BellAlertIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ActionConfiguratorProps {
  moduleType: ModuleType;
  onActionConfigured: (actionType: ActionType, config: any) => void;
  onCancel: () => void;
  initialActionType?: ActionType;
  initialConfig?: any;
}

export const ActionConfigurator: React.FC<ActionConfiguratorProps> = ({
  moduleType,
  onActionConfigured,
  onCancel,
  initialActionType,
  initialConfig
}) => {
  const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(initialActionType || null);
  const [actionConfig, setActionConfig] = useState<any>(initialConfig || {});
  
  useEffect(() => {
    if (initialActionType && initialConfig) {
      setSelectedActionType(initialActionType);
      setActionConfig(initialConfig);
    } else if (initialActionType) {
      setSelectedActionType(initialActionType);
      setActionConfig({ module: moduleType });
    }
  }, [initialActionType, initialConfig, moduleType]);
  
  // Define available actions based on module type
  const getAvailableActions = (module: ModuleType): Array<{
    type: ActionType;
    name: string;
    description: string;
    icon: React.ReactNode;
  }> => {
    const commonActions = [
      {
        type: 'send_notification',
        name: 'Send Notification',
        description: 'Send an in-app notification to users',
        icon: <BellAlertIcon className="h-6 w-6" />
      },
      {
        type: 'send_email',
        name: 'Send Email',
        description: 'Send an email to users',
        icon: <EnvelopeIcon className="h-6 w-6" />
      },
      {
        type: 'http_request',
        name: 'HTTP Request',
        description: 'Make an HTTP request to an external system',
        icon: <GlobeAltIcon className="h-6 w-6" />
      },
      {
        type: 'set_variable',
        name: 'Set Variable',
        description: 'Set a workflow variable value',
        icon: <CodeBracketIcon className="h-6 w-6" />
      }
    ];
    
    const moduleActions: Record<ModuleType, Array<{
      type: ActionType;
      name: string;
      description: string;
      icon: React.ReactNode;
    }>> = {
      tickets: [
        {
          type: 'update_field',
          name: 'Update Ticket Field',
          description: 'Update a field on a ticket',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Ticket Status',
          description: 'Change the status of a ticket',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'assign_user',
          name: 'Assign Ticket',
          description: 'Assign a ticket to a user or team',
          icon: <UserIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Ticket',
          description: 'Create a new ticket',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      problems: [
        {
          type: 'update_field',
          name: 'Update Problem Field',
          description: 'Update a field on a problem',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Problem Status',
          description: 'Change the status of a problem',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'assign_user',
          name: 'Assign Problem',
          description: 'Assign a problem to a user or team',
          icon: <UserIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Problem',
          description: 'Create a new problem',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      changes: [
        {
          type: 'update_field',
          name: 'Update Change Field',
          description: 'Update a field on a change',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Change Status',
          description: 'Change the status of a change',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'assign_user',
          name: 'Assign Change',
          description: 'Assign a change to a user or team',
          icon: <UserIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Change',
          description: 'Create a new change',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      improvements: [
        {
          type: 'update_field',
          name: 'Update Improvement Field',
          description: 'Update a field on an improvement',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Improvement Status',
          description: 'Change the status of an improvement',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Improvement',
          description: 'Create a new improvement',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      knowledge: [
        {
          type: 'update_field',
          name: 'Update Article Field',
          description: 'Update a field on a knowledge article',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Article Status',
          description: 'Change the status of a knowledge article',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Article',
          description: 'Create a new knowledge article',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      service_catalog: [
        {
          type: 'update_field',
          name: 'Update Request Field',
          description: 'Update a field on a service request',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'update_status',
          name: 'Update Request Status',
          description: 'Change the status of a service request',
          icon: <TagIcon className="h-6 w-6" />
        },
        {
          type: 'assign_user',
          name: 'Assign Request',
          description: 'Assign a service request to a user or team',
          icon: <UserIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create Service Request',
          description: 'Create a new service request',
          icon: <DocumentTextIcon className="h-6 w-6" />
        }
      ],
      users: [
        {
          type: 'update_field',
          name: 'Update User Field',
          description: 'Update a field on a user',
          icon: <PencilIcon className="h-6 w-6" />
        },
        {
          type: 'create_record',
          name: 'Create User',
          description: 'Create a new user',
          icon: <UserIcon className="h-6 w-6" />
        }
      ],
      notifications: [
        {
          type: 'send_notification',
          name: 'Send Notification',
          description: 'Send an in-app notification to users',
          icon: <BellAlertIcon className="h-6 w-6" />
        },
        {
          type: 'send_email',
          name: 'Send Email',
          description: 'Send an email to users',
          icon: <EnvelopeIcon className="h-6 w-6" />
        }
      ],
      external: [
        {
          type: 'http_request',
          name: 'HTTP Request',
          description: 'Make an HTTP request to an external system',
          icon: <GlobeAltIcon className="h-6 w-6" />
        }
      ]
    };
    
    return [...moduleActions[module], ...commonActions];
  };
  
  const availableActions = getAvailableActions(moduleType);
  
  const handleActionSelect = (actionType: ActionType) => {
    setSelectedActionType(actionType);
    
    // Initialize config based on action type
    let initialConfig: any = { module: moduleType };
    
    if (actionType === 'send_email') {
      initialConfig = {
        ...initialConfig,
        email: {
          to: [],
          subject: '',
          body: ''
        }
      };
    } else if (actionType === 'send_notification') {
      initialConfig = {
        ...initialConfig,
        notification: {
          users: [],
          message: ''
        }
      };
    } else if (actionType === 'http_request') {
      initialConfig = {
        ...initialConfig,
        webhook: {
          url: '',
          method: 'GET',
          headers: {}
        }
      };
    } else if (actionType === 'set_variable') {
      initialConfig = {
        ...initialConfig,
        name: '',
        value: ''
      };
    }
    
    setActionConfig(initialConfig);
  };
  
  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setActionConfig({
        ...actionConfig,
        [parent]: {
          ...actionConfig[parent],
          [child]: value
        }
      });
    } else {
      setActionConfig({
        ...actionConfig,
        [field]: value
      });
    }
  };
  
  const handleSubmit = () => {
    if (selectedActionType) {
      onActionConfigured(selectedActionType, actionConfig);
    }
  };
  
  const renderActionConfig = () => {
    if (!selectedActionType) return null;
    
    switch (selectedActionType) {
      case 'update_field':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                id="field"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.field || ''}
                onChange={(e) => handleConfigChange('field', e.target.value)}
                placeholder="e.g. status, priority, etc."
              />
            </div>
            
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Field Value
              </label>
              <input
                type="text"
                id="value"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="New value or $variable"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use variables with $ prefix, e.g. $ticketId
              </p>
            </div>
          </div>
        );
        
      case 'update_status':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.status || ''}
                onChange={(e) => handleConfigChange('status', e.target.value)}
              >
                <option value="">Select a status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        );
        
      case 'assign_user':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <input
                type="text"
                id="user"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.user || ''}
                onChange={(e) => handleConfigChange('user', e.target.value)}
                placeholder="User ID or $variable"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use variables with $ prefix, e.g. $assigneeId
              </p>
            </div>
          </div>
        );
        
      case 'create_record':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="Title or $variable"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Description or $variable"
              />
            </div>
            
            {moduleType === 'tickets' && (
              <>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={actionConfig.priority || ''}
                    onChange={(e) => handleConfigChange('priority', e.target.value)}
                  >
                    <option value="">Select a priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={actionConfig.category || ''}
                    onChange={(e) => handleConfigChange('category', e.target.value)}
                    placeholder="Category or $variable"
                  />
                </div>
              </>
            )}
          </div>
        );
        
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                id="to"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.email?.to.join(', ') || ''}
                onChange={(e) => handleConfigChange('email.to', e.target.value.split(',').map((email: string) => email.trim()))}
                placeholder="email@example.com, $userEmail"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple emails with commas. You can use variables with $ prefix.
              </p>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.email?.subject || ''}
                onChange={(e) => handleConfigChange('email.subject', e.target.value)}
                placeholder="Email subject or $variable"
              />
            </div>
            
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                id="body"
                rows={5}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.email?.body || ''}
                onChange={(e) => handleConfigChange('email.body', e.target.value)}
                placeholder="Email body content or $variable"
              />
            </div>
          </div>
        );
        
      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="users" className="block text-sm font-medium text-gray-700 mb-1">
                Users
              </label>
              <input
                type="text"
                id="users"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.notification?.users.join(', ') || ''}
                onChange={(e) => handleConfigChange('notification.users', e.target.value.split(',').map((user: string) => user.trim()))}
                placeholder="user1, user2, $assigneeId"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple users with commas. You can use variables with $ prefix.
              </p>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={3}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.notification?.message || ''}
                onChange={(e) => handleConfigChange('notification.message', e.target.value)}
                placeholder="Notification message or $variable"
              />
            </div>
            
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                Link (Optional)
              </label>
              <input
                type="text"
                id="link"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.notification?.link || ''}
                onChange={(e) => handleConfigChange('notification.link', e.target.value)}
                placeholder="/tickets/$ticketId"
              />
            </div>
          </div>
        );
        
      case 'http_request':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="text"
                id="url"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.webhook?.url || ''}
                onChange={(e) => handleConfigChange('webhook.url', e.target.value)}
                placeholder="https://example.com/api"
              />
            </div>
            
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                id="method"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.webhook?.method || 'GET'}
                onChange={(e) => handleConfigChange('webhook.method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Body (for POST/PUT)
              </label>
              <textarea
                id="body"
                rows={3}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.webhook?.body || ''}
                onChange={(e) => handleConfigChange('webhook.body', e.target.value)}
                placeholder='{"key": "value", "variable": "$ticketId"}'
              />
              <p className="mt-1 text-xs text-gray-500">
                JSON format. You can use variables with $ prefix.
              </p>
            </div>
          </div>
        );
        
      case 'set_variable':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.name || ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="myVariable"
              />
              <p className="mt-1 text-xs text-gray-500">
                Variable name without $ prefix
              </p>
            </div>
            
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Variable Value
              </label>
              <input
                type="text"
                id="value"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={actionConfig.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="Value or $existingVariable"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use existing variables with $ prefix
              </p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              No additional configuration needed for this action type.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configure Action</h3>
        <p className="mt-1 text-sm text-gray-500">
          Define what this workflow step should do
        </p>
      </div>
      
      <div className="p-6">
        {!selectedActionType ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableActions.map((action) => (
              <div
                key={action.type}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => handleActionSelect(action.type)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-primary">
                    {action.icon}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base font-medium text-gray-900">{action.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={() => setSelectedActionType(null)}
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <h4 className="ml-4 text-lg font-medium text-gray-900">
                {availableActions.find(a => a.type === selectedActionType)?.name}
              </h4>
            </div>
            
            <div className="mt-4">
              {renderActionConfig()}
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleSubmit}
          disabled={!selectedActionType}
        >
          {selectedActionType ? 'Save Action' : 'Select an Action'}
        </button>
      </div>
    </div>
  );
};

export default ActionConfigurator;
