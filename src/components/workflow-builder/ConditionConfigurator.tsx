import React, { useState, useEffect } from 'react';
import { ModuleType } from '../../types/workflowAutomation';
import { 
  PlusIcon, 
  MinusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ConditionConfiguratorProps {
  moduleType: ModuleType;
  onConditionConfigured: (conditions: any) => void;
  onCancel: () => void;
  initialConditions?: any;
}

type Operator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
type LogicalOperator = 'and' | 'or';

interface Condition {
  field: string;
  operator: Operator;
  value: string;
}

interface ConditionGroup {
  conditions: Condition[];
  logicalOperator: LogicalOperator;
}

export const ConditionConfigurator: React.FC<ConditionConfiguratorProps> = ({
  moduleType,
  onConditionConfigured,
  onCancel,
  initialConditions
}) => {
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([
    { conditions: [{ field: '', operator: 'equals', value: '' }], logicalOperator: 'and' }
  ]);
  
  useEffect(() => {
    if (initialConditions) {
      setConditionGroups(initialConditions.groups || [
        { conditions: [{ field: '', operator: 'equals', value: '' }], logicalOperator: 'and' }
      ]);
    }
  }, [initialConditions]);
  
  const getFieldSuggestions = (module: ModuleType): string[] => {
    switch (module) {
      case 'tickets':
        return ['status', 'priority', 'category', 'assignee', 'reporter', 'title', 'description', 'created_at', 'updated_at'];
      case 'problems':
        return ['status', 'priority', 'impact', 'assignee', 'reporter', 'title', 'description', 'created_at', 'updated_at'];
      case 'changes':
        return ['status', 'priority', 'impact', 'risk', 'assignee', 'reporter', 'title', 'description', 'created_at', 'updated_at'];
      case 'improvements':
        return ['status', 'priority', 'category', 'assignee', 'reporter', 'title', 'description', 'created_at', 'updated_at'];
      case 'knowledge':
        return ['status', 'category', 'author', 'title', 'content', 'created_at', 'updated_at'];
      case 'service_catalog':
        return ['status', 'category', 'requester', 'assignee', 'title', 'description', 'created_at', 'updated_at'];
      case 'users':
        return ['name', 'email', 'role', 'department', 'created_at', 'updated_at'];
      case 'notifications':
        return ['type', 'recipient', 'message', 'read', 'created_at'];
      case 'external':
        return ['status_code', 'response_body', 'headers'];
      default:
        return [];
    }
  };
  
  const fieldSuggestions = getFieldSuggestions(moduleType);
  
  const operatorOptions: { value: Operator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' }
  ];
  
  const handleAddCondition = (groupIndex: number) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions.push({ field: '', operator: 'equals', value: '' });
    setConditionGroups(newGroups);
  };
  
  const handleRemoveCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...conditionGroups];
    if (newGroups[groupIndex].conditions.length > 1) {
      newGroups[groupIndex].conditions.splice(conditionIndex, 1);
      setConditionGroups(newGroups);
    }
  };
  
  const handleAddGroup = () => {
    setConditionGroups([
      ...conditionGroups,
      { conditions: [{ field: '', operator: 'equals', value: '' }], logicalOperator: 'and' }
    ]);
  };
  
  const handleRemoveGroup = (groupIndex: number) => {
    if (conditionGroups.length > 1) {
      const newGroups = [...conditionGroups];
      newGroups.splice(groupIndex, 1);
      setConditionGroups(newGroups);
    }
  };
  
  const handleConditionChange = (groupIndex: number, conditionIndex: number, field: keyof Condition, value: string) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions[conditionIndex][field] = value as any;
    setConditionGroups(newGroups);
  };
  
  const handleLogicalOperatorChange = (groupIndex: number, value: LogicalOperator) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].logicalOperator = value;
    setConditionGroups(newGroups);
  };
  
  const handleSubmit = () => {
    // Filter out empty conditions
    const filteredGroups = conditionGroups.map(group => ({
      ...group,
      conditions: group.conditions.filter(c => c.field.trim() !== '')
    })).filter(group => group.conditions.length > 0);
    
    onConditionConfigured({
      groups: filteredGroups,
      module: moduleType
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configure Conditions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Define conditions for this workflow branch
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {conditionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-gray-50 p-4 rounded-md relative">
              {conditionGroups.length > 1 && (
                <button
                  type="button"
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                  onClick={() => handleRemoveGroup(groupIndex)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logical Operator for this Group
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary focus:ring-primary"
                      checked={group.logicalOperator === 'and'}
                      onChange={() => handleLogicalOperatorChange(groupIndex, 'and')}
                    />
                    <span className="ml-2 text-sm text-gray-700">AND</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary focus:ring-primary"
                      checked={group.logicalOperator === 'or'}
                      onChange={() => handleLogicalOperatorChange(groupIndex, 'or')}
                    />
                    <span className="ml-2 text-sm text-gray-700">OR</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                {group.conditions.map((condition, conditionIndex) => (
                  <div key={conditionIndex} className="flex items-start space-x-2">
                    <div className="w-1/3">
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${conditionIndex > 0 ? 'sr-only' : ''}`}>
                        Field
                      </label>
                      <input
                        type="text"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={condition.field}
                        onChange={(e) => handleConditionChange(groupIndex, conditionIndex, 'field', e.target.value)}
                        placeholder="Field name or $variable"
                        list={`fields-${groupIndex}-${conditionIndex}`}
                      />
                      <datalist id={`fields-${groupIndex}-${conditionIndex}`}>
                        {fieldSuggestions.map((field) => (
                          <option key={field} value={field} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div className="w-1/3">
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${conditionIndex > 0 ? 'sr-only' : ''}`}>
                        Operator
                      </label>
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={condition.operator}
                        onChange={(e) => handleConditionChange(groupIndex, conditionIndex, 'operator', e.target.value as Operator)}
                      >
                        {operatorOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-1/3">
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${conditionIndex > 0 ? 'sr-only' : ''}`}>
                        Value
                      </label>
                      <input
                        type="text"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={condition.value}
                        onChange={(e) => handleConditionChange(groupIndex, conditionIndex, 'value', e.target.value)}
                        placeholder="Value or $variable"
                        disabled={['is_empty', 'is_not_empty'].includes(condition.operator)}
                      />
                    </div>
                    
                    <div className="flex items-center pt-6">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => handleRemoveCondition(groupIndex, conditionIndex)}
                        disabled={group.conditions.length === 1}
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => handleAddCondition(groupIndex)}
                >
                  <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Add Condition
                </button>
              </div>
            </div>
          ))}
          
          <div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleAddGroup}
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Add Condition Group
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Conditions within a group are combined with {conditionGroups[0]?.logicalOperator.toUpperCase()}. 
              Different groups are combined with OR.
            </p>
          </div>
        </div>
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
        >
          Save Conditions
        </button>
      </div>
    </div>
  );
};

export default ConditionConfigurator;
