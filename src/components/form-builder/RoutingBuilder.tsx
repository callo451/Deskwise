import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { 
  FormField, 
  FormFieldRouting, 
  FormFieldCondition,
  ConditionOperator,
  RoutingAction,
  LogicOperator
} from '../../types/formBuilder';

interface RoutingBuilderProps {
  fields: Record<string, FormField>;
  routing: FormFieldRouting[];
  onChange: (routing: FormFieldRouting[]) => void;
}

export const RoutingBuilder: React.FC<RoutingBuilderProps> = ({
  fields,
  routing,
  onChange
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // Get fields that can be used as condition sources (exclude layout fields)
  const sourceFields = Object.values(fields).filter(field => 
    !['heading', 'paragraph', 'section'].includes(field.type)
  );
  
  // Get fields that can be targets of routing rules
  const targetFields = Object.values(fields);
  
  const addNewRule = () => {
    const newRule: FormFieldRouting = {
      id: `rule_${Date.now()}`,
      conditions: [{
        sourceFieldId: sourceFields.length > 0 ? sourceFields[0].id : '',
        operator: 'equals',
        value: ''
      }],
      action: 'show',
      targetFieldIds: [],
      logicOperator: 'AND'
    };
    
    onChange([...routing, newRule]);
    setEditingRuleId(newRule.id);
  };
  
  const updateRule = (ruleId: string, updates: Partial<FormFieldRouting>) => {
    onChange(
      routing.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };
  
  const removeRule = (ruleId: string) => {
    onChange(routing.filter(rule => rule.id !== ruleId));
    if (editingRuleId === ruleId) {
      setEditingRuleId(null);
    }
  };
  
  const addCondition = (ruleId: string) => {
    const rule = routing.find(r => r.id === ruleId);
    if (!rule) return;
    
    const newCondition: FormFieldCondition = {
      sourceFieldId: sourceFields.length > 0 ? sourceFields[0].id : '',
      operator: 'equals',
      value: ''
    };
    
    updateRule(ruleId, {
      conditions: [...rule.conditions, newCondition]
    });
  };
  
  const updateCondition = (
    ruleId: string, 
    conditionIndex: number, 
    updates: Partial<FormFieldCondition>
  ) => {
    const rule = routing.find(r => r.id === ruleId);
    if (!rule) return;
    
    const updatedConditions = [...rule.conditions];
    updatedConditions[conditionIndex] = {
      ...updatedConditions[conditionIndex],
      ...updates
    };
    
    updateRule(ruleId, { conditions: updatedConditions });
  };
  
  const removeCondition = (ruleId: string, conditionIndex: number) => {
    const rule = routing.find(r => r.id === ruleId);
    if (!rule || rule.conditions.length <= 1) return;
    
    const updatedConditions = [...rule.conditions];
    updatedConditions.splice(conditionIndex, 1);
    
    updateRule(ruleId, { conditions: updatedConditions });
  };
  
  const getOperatorLabel = (operator: ConditionOperator): string => {
    switch (operator) {
      case 'equals': return 'equals';
      case 'notEquals': return 'does not equal';
      case 'contains': return 'contains';
      case 'notContains': return 'does not contain';
      case 'greaterThan': return 'is greater than';
      case 'lessThan': return 'is less than';
      case 'startsWith': return 'starts with';
      case 'endsWith': return 'ends with';
      default: return operator;
    }
  };
  
  const getActionLabel = (action: RoutingAction): string => {
    switch (action) {
      case 'show': return 'Show';
      case 'hide': return 'Hide';
      case 'require': return 'Make required';
      case 'skip': return 'Skip to section';
      default: return action;
    }
  };
  
  const renderConditionEditor = (rule: FormFieldRouting, conditionIndex: number) => {
    const condition = rule.conditions[conditionIndex];
    const sourceField = fields[condition.sourceFieldId];
    
    return (
      <div key={conditionIndex} className="flex items-center space-x-2 mb-2">
        {conditionIndex > 0 && (
          <div className="text-sm font-medium text-gray-700">
            {rule.logicOperator}
          </div>
        )}
        
        <select
          value={condition.sourceFieldId}
          onChange={(e) => updateCondition(rule.id, conditionIndex, { 
            sourceFieldId: e.target.value 
          })}
          className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="" disabled>Select a field</option>
          {sourceFields.map(field => (
            <option key={field.id} value={field.id}>
              {field.label}
            </option>
          ))}
        </select>
        
        <select
          value={condition.operator}
          onChange={(e) => updateCondition(rule.id, conditionIndex, { 
            operator: e.target.value as ConditionOperator 
          })}
          className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          {['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'startsWith', 'endsWith'].map(op => (
            <option key={op} value={op}>
              {getOperatorLabel(op as ConditionOperator)}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          value={condition.value}
          onChange={(e) => updateCondition(rule.id, conditionIndex, { 
            value: e.target.value 
          })}
          placeholder="Value"
          className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        />
        
        {rule.conditions.length > 1 && (
          <button
            onClick={() => removeCondition(rule.id, conditionIndex)}
            className="text-gray-400 hover:text-red-500"
            title="Remove Condition"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };
  
  const renderRuleEditor = (rule: FormFieldRouting) => {
    return (
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Edit Rule</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conditions
          </label>
          
          <div className="space-y-2 mb-2">
            {rule.conditions.map((_, index) => renderConditionEditor(rule, index))}
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => addCondition(rule.id)}
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Condition
            </button>
            
            {rule.conditions.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Logic:</span>
                <select
                  value={rule.logicOperator}
                  onChange={(e) => updateRule(rule.id, { 
                    logicOperator: e.target.value as LogicOperator 
                  })}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                >
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action
          </label>
          
          <div className="flex items-center space-x-2">
            <select
              value={rule.action}
              onChange={(e) => updateRule(rule.id, { 
                action: e.target.value as RoutingAction 
              })}
              className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            >
              {['show', 'hide', 'require', 'skip'].map(action => (
                <option key={action} value={action}>
                  {getActionLabel(action as RoutingAction)}
                </option>
              ))}
            </select>
            
            <div className="flex-1">
              <select
                multiple
                value={rule.targetFieldIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  updateRule(rule.id, { targetFieldIds: selectedOptions });
                }}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                size={4}
              >
                {targetFields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple fields
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setEditingRuleId(null)}
          >
            Done
          </Button>
        </div>
      </div>
    );
  };
  
  const renderRuleSummary = (rule: FormFieldRouting) => {
    const isEditing = editingRuleId === rule.id;
    
    if (isEditing) {
      return renderRuleEditor(rule);
    }
    
    const targetLabels = rule.targetFieldIds
      .map(id => fields[id]?.label || 'Unknown field')
      .join(', ');
    
    const conditionText = rule.conditions.map((condition, index) => {
      const sourceField = fields[condition.sourceFieldId];
      const sourceLabel = sourceField?.label || 'Unknown field';
      
      return (
        <span key={index}>
          {index > 0 && <span className="mx-1 font-medium">{rule.logicOperator}</span>}
          <span className="font-medium">{sourceLabel}</span>
          {' '}
          <span>{getOperatorLabel(condition.operator)}</span>
          {' '}
          <span className="font-medium">"{condition.value}"</span>
        </span>
      );
    });
    
    return (
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {getActionLabel(rule.action)} {targetLabels}
            </h4>
            <p className="text-sm text-gray-600">
              When {conditionText}
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setEditingRuleId(rule.id)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Edit Rule"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove this rule?')) {
                  removeRule(rule.id);
                }
              }}
              className="text-gray-400 hover:text-red-500 p-1"
              title="Remove Rule"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Conditional Logic</h3>
        <Button 
          onClick={addNewRule}
          size="sm"
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>
      
      {routing.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No conditional logic rules added yet.</p>
          <Button 
            onClick={addNewRule}
            variant="outline"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Your First Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {routing.map(rule => (
            <div key={rule.id}>
              {renderRuleSummary(rule)}
            </div>
          ))}
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
              Conditional logic allows you to show or hide fields based on user input. 
              This creates a dynamic form that adapts to the user's responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
