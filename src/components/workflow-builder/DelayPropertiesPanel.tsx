import React from 'react';
import { Node } from 'reactflow';
import { 
  DelayNode,
  DelayType,
  WorkflowVariable
} from '../../types/workflowAutomation';

interface DelayPropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: Partial<DelayNode>) => void;
  variables: WorkflowVariable[];
}

export const DelayPropertiesPanel: React.FC<DelayPropertiesPanelProps> = ({
  node,
  onUpdate,
  variables
}) => {
  const delayType = node.data.delayType || 'fixed_time';
  
  const handleDelayTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { delayType: e.target.value as DelayType });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delay Type
        </label>
        <select
          value={delayType}
          onChange={handleDelayTypeChange}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="fixed_time">Fixed Time</option>
          <option value="business_hours">Business Hours</option>
          <option value="until_date">Until Date</option>
          <option value="until_condition">Until Condition</option>
        </select>
      </div>
      
      {delayType === 'fixed_time' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={node.data.config?.duration || 60}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, duration: parseInt(e.target.value) || 60 }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
      )}
      
      {delayType === 'business_hours' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={node.data.config?.duration || 60}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, duration: parseInt(e.target.value) || 60 }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="business-hours-checkbox"
              checked={node.data.config?.businessHours || false}
              onChange={(e) => onUpdate(node.id, { 
                config: { ...node.data.config, businessHours: e.target.checked }
              })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="business-hours-checkbox" className="ml-2 block text-sm text-gray-700">
              Only count business hours
            </label>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Business hours are defined in the system settings.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {delayType === 'until_date' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={node.data.config?.until?.date || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  until: { 
                    ...node.data.config?.until,
                    date: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={node.data.config?.until?.time || ''}
              onChange={(e) => onUpdate(node.id, { 
                config: { 
                  ...node.data.config, 
                  until: { 
                    ...node.data.config?.until,
                    time: e.target.value
                  } 
                }
              })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
        </>
      )}
      
      {delayType === 'until_condition' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition
          </label>
          <textarea
            value={typeof node.data.config?.until?.condition === 'object' 
              ? JSON.stringify(node.data.config.until.condition, null, 2) 
              : node.data.config?.until?.condition || ''}
            onChange={(e) => {
              try {
                const condition = JSON.parse(e.target.value);
                onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    until: { 
                      ...node.data.config?.until,
                      condition
                    } 
                  }
                });
              } catch (error) {
                // If not valid JSON, store as string
                onUpdate(node.id, { 
                  config: { 
                    ...node.data.config, 
                    until: { 
                      ...node.data.config?.until,
                      condition: e.target.value
                    } 
                  }
                });
              }
            }}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            placeholder="Condition expression (e.g. $ticket.status === 'resolved')"
            rows={3}
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
              Delays pause the workflow execution until the specified time or condition is met.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayPropertiesPanel;
