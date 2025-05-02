import React from 'react';
import { Node } from 'reactflow';
import { 
  TriggerType, 
  ConditionType
} from '../../types/workflowAutomation';
import { Button } from '../ui/Button';
import { TrashIcon } from '@heroicons/react/24/outline';

interface NodePropertiesPanelProps {
  node: Node<any>;
  onUpdate: (nodeId: string, updates: any) => void;
  onDelete: (nodeId: string) => void;
  onConfigureNode?: (nodeType: string) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onConfigureNode
}) => {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(node.id, { label: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(node.id, { description: e.target.value });
  };

  const renderTriggerProperties = () => {
    const triggerType = node.data.config?.triggerType || 'record_created';
    
    const handleTriggerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(node.id, { 
        data: {
          ...node.data,
          config: { 
            ...node.data.config, 
            triggerType: e.target.value as TriggerType,
            module: node.data.config?.module || 'tickets' 
          }
        }
      });
    };
    
    const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(node.id, { 
        config: { ...node.data.config, module: e.target.value }
      });
    };
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Type
          </label>
          <select
            value={triggerType}
            onChange={handleTriggerTypeChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          >
            <option value="record_created">Record Created</option>
            <option value="record_updated">Record Updated</option>
            <option value="field_changed">Field Changed</option>
            <option value="status_changed">Status Changed</option>
            <option value="assignment_changed">Assignment Changed</option>
            <option value="comment_added">Comment Added</option>
            <option value="scheduled">Scheduled</option>
            <option value="form_submitted">Form Submitted</option>
            <option value="webhook">Webhook</option>
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
        
        {triggerType === 'field_changed' && (
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
        )}
        
        {triggerType === 'scheduled' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={node.data.config?.schedule?.frequency || 'daily'}
                onChange={(e) => onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    schedule: { 
                      ...node.data.config?.schedule,
                      frequency: e.target.value as 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly'
                    } 
                  }
                })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              >
                <option value="once">Once</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={node.data.config?.schedule?.time || ''}
                onChange={(e) => onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    schedule: { 
                      ...node.data.config?.schedule,
                      time: e.target.value
                    } 
                  }
                })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        )}
        
        {triggerType === 'webhook' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
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
                placeholder="https://example.com/webhook"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                URL will be generated when the workflow is activated
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConditionProperties = () => {
    const conditionType = node.data.config?.conditionType || 'field_equals';
    
    const handleConditionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(node.id, { 
        data: {
          ...node.data,
          config: { 
            ...node.data.config, 
            conditionType: e.target.value as ConditionType 
          }
        }
      });
    };
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition Type
          </label>
          <select
            value={conditionType}
            onChange={handleConditionTypeChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          >
            <option value="field_equals">Field Equals</option>
            <option value="field_not_equals">Field Not Equals</option>
            <option value="field_contains">Field Contains</option>
            <option value="field_not_contains">Field Not Contains</option>
            <option value="field_greater_than">Field Greater Than</option>
            <option value="field_less_than">Field Less Than</option>
            <option value="field_is_empty">Field Is Empty</option>
            <option value="field_is_not_empty">Field Is Not Empty</option>
            <option value="user_is">User Is</option>
            <option value="user_in_group">User In Group</option>
            <option value="status_is">Status Is</option>
            <option value="priority_is">Priority Is</option>
            <option value="custom_expression">Custom Expression</option>
          </select>
        </div>
        
        {conditionType.startsWith('field_') && conditionType !== 'field_is_empty' && conditionType !== 'field_is_not_empty' && (
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
                placeholder="Value"
              />
            </div>
          </>
        )}
        
        {(conditionType === 'field_is_empty' || conditionType === 'field_is_not_empty') && (
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
        )}
        
        {conditionType === 'user_is' && (
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
        
        {conditionType === 'user_in_group' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <input
              type="text"
              value={node.data.config?.group || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, group: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Group ID or name"
            />
          </div>
        )}
        
        {conditionType === 'status_is' && (
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
        
        {conditionType === 'priority_is' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <input
              type="text"
              value={node.data.config?.priority || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, priority: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Priority ID or name"
            />
          </div>
        )}
        
        {conditionType === 'custom_expression' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expression
            </label>
            <textarea
              value={node.data.config?.expression || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, expression: e.target.value }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Custom expression"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables with $ prefix, e.g. $ticket.priority &gt; 2
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderNodeProperties = () => {
    switch (node.type) {
      case 'trigger':
        return renderTriggerProperties();
      case 'condition':
        return renderConditionProperties();
      case 'action':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                Please use the action configurator to set up this action node.
              </p>
              {onConfigureNode && (
                <button
                  onClick={() => onConfigureNode('action')}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Configure Action
                </button>
              )}
            </div>
          </div>
        );
      case 'delay':
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Please use the delay configurator to set up this delay node.
            </p>
          </div>
        );
      case 'loop':
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Please use the loop configurator to set up this loop node.
            </p>
          </div>
        );
      case 'junction':
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Junction nodes direct workflow based on conditions from previous nodes.
            </p>
          </div>
        );
      default:
        return <p>No properties available for this node type.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Node Properties</h3>
        <Button 
          onClick={() => onDelete(node.id)}
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-700 border-red-300 hover:border-red-500 flex items-center"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={handleLabelChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="Node label"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={node.data.description || ''}
            onChange={handleDescriptionChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="Node description"
            rows={2}
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Node-Specific Properties</h4>
        {renderNodeProperties()}
      </div>
    </div>
  );
};

// These are defined outside the main component to avoid hitting token limits
const renderActionProperties = () => {
  // Implementation will be in ActionPropertiesPanel.tsx
  return <p>Action properties are loaded from a separate component.</p>;
};

const renderDelayProperties = () => {
  // Implementation will be in DelayPropertiesPanel.tsx
  return <p>Delay properties are loaded from a separate component.</p>;
};

const renderLoopProperties = () => {
  // Implementation will be in LoopPropertiesPanel.tsx
  return <p>Loop properties are loaded from a separate component.</p>;
};

const renderJunctionProperties = () => {
  // Implementation will be in JunctionPropertiesPanel.tsx
  return <p>Junction properties are loaded from a separate component.</p>;
};
