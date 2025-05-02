import React, { useState } from 'react';
import { ModuleType, TriggerType } from '../../types/workflowAutomation';
import { 
  PlusCircleIcon, 
  BoltIcon, 
  ClockIcon, 
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface TriggerSelectorProps {
  moduleType: ModuleType;
  onTriggerSelect: (triggerType: TriggerType, config: any) => void;
  onCancel: () => void;
}

export const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  moduleType,
  onTriggerSelect,
  onCancel
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  
  // Define available triggers based on module type
  const getAvailableTriggers = (module: ModuleType): Array<{
    type: TriggerType;
    name: string;
    description: string;
    icon: React.ReactNode;
  }> => {
    const commonTriggers = [
      {
        type: 'scheduled',
        name: 'Scheduled',
        description: 'Run workflow on a schedule',
        icon: <ClockIcon className="h-6 w-6" />
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Trigger from external system via HTTP',
        icon: <GlobeAltIcon className="h-6 w-6" />
      }
    ];
    
    const moduleTriggers: Record<ModuleType, Array<{
      type: TriggerType;
      name: string;
      description: string;
      icon: React.ReactNode;
    }>> = {
      tickets: [
        {
          type: 'record_created',
          name: 'Ticket Created',
          description: 'When a new ticket is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'Ticket Updated',
          description: 'When any ticket field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When ticket status changes',
          icon: <BoltIcon className="h-6 w-6" />
        },
        {
          type: 'assignment_changed',
          name: 'Assignment Changed',
          description: 'When ticket is assigned to someone else',
          icon: <UserIcon className="h-6 w-6" />
        },
        {
          type: 'comment_added',
          name: 'Comment Added',
          description: 'When a comment is added to a ticket',
          icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />
        }
      ],
      problems: [
        {
          type: 'record_created',
          name: 'Problem Created',
          description: 'When a new problem is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'Problem Updated',
          description: 'When any problem field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When problem status changes',
          icon: <BoltIcon className="h-6 w-6" />
        },
        {
          type: 'assignment_changed',
          name: 'Assignment Changed',
          description: 'When problem is assigned to someone else',
          icon: <UserIcon className="h-6 w-6" />
        }
      ],
      changes: [
        {
          type: 'record_created',
          name: 'Change Created',
          description: 'When a new change is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'Change Updated',
          description: 'When any change field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When change status changes',
          icon: <BoltIcon className="h-6 w-6" />
        },
        {
          type: 'assignment_changed',
          name: 'Assignment Changed',
          description: 'When change is assigned to someone else',
          icon: <UserIcon className="h-6 w-6" />
        }
      ],
      improvements: [
        {
          type: 'record_created',
          name: 'Improvement Created',
          description: 'When a new improvement is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'Improvement Updated',
          description: 'When any improvement field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When improvement status changes',
          icon: <BoltIcon className="h-6 w-6" />
        }
      ],
      knowledge: [
        {
          type: 'record_created',
          name: 'Article Created',
          description: 'When a new knowledge article is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'Article Updated',
          description: 'When any article field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When article status changes',
          icon: <BoltIcon className="h-6 w-6" />
        }
      ],
      service_catalog: [
        {
          type: 'form_submitted',
          name: 'Form Submitted',
          description: 'When a service catalog form is submitted',
          icon: <DocumentTextIcon className="h-6 w-6" />
        },
        {
          type: 'record_created',
          name: 'Service Request Created',
          description: 'When a new service request is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'status_changed',
          name: 'Status Changed',
          description: 'When service request status changes',
          icon: <BoltIcon className="h-6 w-6" />
        }
      ],
      users: [
        {
          type: 'record_created',
          name: 'User Created',
          description: 'When a new user is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        },
        {
          type: 'record_updated',
          name: 'User Updated',
          description: 'When any user field is updated',
          icon: <ArrowPathIcon className="h-6 w-6" />
        }
      ],
      notifications: [
        {
          type: 'record_created',
          name: 'Notification Created',
          description: 'When a new notification is created',
          icon: <PlusCircleIcon className="h-6 w-6" />
        }
      ],
      external: [
        {
          type: 'webhook',
          name: 'Webhook',
          description: 'Trigger from external system via HTTP',
          icon: <GlobeAltIcon className="h-6 w-6" />
        }
      ]
    };
    
    return [...moduleTriggers[module], ...commonTriggers];
  };
  
  const availableTriggers = getAvailableTriggers(moduleType);
  
  const handleTriggerSelect = (triggerType: TriggerType) => {
    setSelectedTrigger(triggerType);
    
    // Initialize config based on trigger type
    let initialConfig: any = { module: moduleType };
    
    if (triggerType === 'scheduled') {
      initialConfig = {
        ...initialConfig,
        schedule: {
          frequency: 'daily',
          time: '09:00'
        }
      };
    } else if (triggerType === 'webhook') {
      initialConfig = {
        ...initialConfig,
        webhook: {
          method: 'POST',
          headers: {}
        }
      };
    } else if (triggerType === 'field_changed') {
      initialConfig = {
        ...initialConfig,
        field: ''
      };
    }
    
    setTriggerConfig(initialConfig);
  };
  
  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTriggerConfig({
        ...triggerConfig,
        [parent]: {
          ...triggerConfig[parent],
          [child]: value
        }
      });
    } else {
      setTriggerConfig({
        ...triggerConfig,
        [field]: value
      });
    }
  };
  
  const handleSubmit = () => {
    if (selectedTrigger) {
      onTriggerSelect(selectedTrigger, triggerConfig);
    }
  };
  
  const renderTriggerConfig = () => {
    if (!selectedTrigger) return null;
    
    switch (selectedTrigger) {
      case 'scheduled':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                id="frequency"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={triggerConfig.schedule?.frequency}
                onChange={(e) => handleConfigChange('schedule.frequency', e.target.value)}
              >
                <option value="once">Once</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {triggerConfig.schedule?.frequency === 'once' && (
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={triggerConfig.schedule?.date || ''}
                  onChange={(e) => handleConfigChange('schedule.date', e.target.value)}
                />
              </div>
            )}
            
            {triggerConfig.schedule?.frequency !== 'once' && (
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={triggerConfig.schedule?.time || ''}
                  onChange={(e) => handleConfigChange('schedule.time', e.target.value)}
                />
              </div>
            )}
            
            {triggerConfig.schedule?.frequency === 'weekly' && (
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  id="day"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={triggerConfig.schedule?.day || 1}
                  onChange={(e) => handleConfigChange('schedule.day', parseInt(e.target.value))}
                >
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="0">Sunday</option>
                </select>
              </div>
            )}
            
            {triggerConfig.schedule?.frequency === 'monthly' && (
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Month
                </label>
                <select
                  id="day"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={triggerConfig.schedule?.day || 1}
                  onChange={(e) => handleConfigChange('schedule.day', parseInt(e.target.value))}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
        
      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                HTTP Method
              </label>
              <select
                id="method"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={triggerConfig.webhook?.method}
                onChange={(e) => handleConfigChange('webhook.method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                A webhook URL will be generated when you save this workflow. You can use this URL to trigger the workflow from external systems.
              </p>
            </div>
          </div>
        );
        
      case 'field_changed':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
                Field
              </label>
              <input
                type="text"
                id="field"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={triggerConfig.field || ''}
                onChange={(e) => handleConfigChange('field', e.target.value)}
                placeholder="e.g. status, priority, etc."
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              No additional configuration needed for this trigger type.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Select a Trigger</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose what will start your workflow automation
        </p>
      </div>
      
      <div className="p-6">
        {!selectedTrigger ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableTriggers.map((trigger) => (
              <div
                key={trigger.type}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => handleTriggerSelect(trigger.type)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-primary">
                    {trigger.icon}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base font-medium text-gray-900">{trigger.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">{trigger.description}</p>
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
                onClick={() => setSelectedTrigger(null)}
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <h4 className="ml-4 text-lg font-medium text-gray-900">
                {availableTriggers.find(t => t.type === selectedTrigger)?.name}
              </h4>
            </div>
            
            <div className="mt-4">
              {renderTriggerConfig()}
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
          disabled={!selectedTrigger}
        >
          {selectedTrigger ? 'Continue' : 'Select a Trigger'}
        </button>
      </div>
    </div>
  );
};

export default TriggerSelector;
