import React, { useState } from 'react';
import { 
  WorkflowVariable
} from '../../types/workflowAutomation';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';

interface WorkflowVariablesPanelProps {
  variables: WorkflowVariable[];
  onChange: (variables: WorkflowVariable[]) => void;
}

export const WorkflowVariablesPanel: React.FC<WorkflowVariablesPanelProps> = ({
  variables,
  onChange
}) => {
  const [newVariable, setNewVariable] = useState<Partial<WorkflowVariable>>({
    name: '',
    type: 'string',
    defaultValue: '',
    description: ''
  });

  const handleAddVariable = () => {
    if (!newVariable.name) return;
    
    const variableId = `var_${Date.now()}`;
    const variable: WorkflowVariable = {
      id: variableId,
      name: newVariable.name,
      type: newVariable.type as 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array',
      defaultValue: newVariable.defaultValue,
      description: newVariable.description
    };
    
    onChange([...variables, variable]);
    
    // Reset the form
    setNewVariable({
      name: '',
      type: 'string',
      defaultValue: '',
      description: ''
    });
  };

  const handleRemoveVariable = (id: string) => {
    onChange(variables.filter(variable => variable.id !== id));
  };

  const handleUpdateVariable = (id: string, updates: Partial<WorkflowVariable>) => {
    onChange(
      variables.map(variable => 
        variable.id === id ? { ...variable, ...updates } : variable
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workflow Variables</h3>
      </div>
      
      <div className="space-y-4">
        {variables.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">No variables defined yet.</p>
            <p className="text-sm text-gray-400">Variables can be used throughout your workflow.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variables.map(variable => (
              <div key={variable.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => handleUpdateVariable(variable.id, { name: e.target.value })}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        placeholder="Variable name"
                      />
                      
                      <select
                        value={variable.type}
                        onChange={(e) => handleUpdateVariable(variable.id, { 
                          type: e.target.value as 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
                        })}
                        className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        value={variable.defaultValue !== undefined ? String(variable.defaultValue) : ''}
                        onChange={(e) => {
                          let value: any = e.target.value;
                          
                          // Convert value based on type
                          if (variable.type === 'number') {
                            value = e.target.value === '' ? '' : Number(e.target.value);
                          } else if (variable.type === 'boolean') {
                            value = e.target.value === 'true';
                          } else if (variable.type === 'object' || variable.type === 'array') {
                            try {
                              value = JSON.parse(e.target.value);
                            } catch (error) {
                              // If not valid JSON, keep as string
                              value = e.target.value;
                            }
                          }
                          
                          handleUpdateVariable(variable.id, { defaultValue: value });
                        }}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        placeholder="Default value"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        value={variable.description || ''}
                        onChange={(e) => handleUpdateVariable(variable.id, { description: e.target.value })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveVariable(variable.id)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    title="Remove Variable"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Variable</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newVariable.name}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Variable name"
              />
              
              <select
                value={newVariable.type}
                onChange={(e) => setNewVariable({ 
                  ...newVariable, 
                  type: e.target.value as 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
                })}
                className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
            </div>
            
            <div>
              <input
                type="text"
                value={newVariable.defaultValue !== undefined ? String(newVariable.defaultValue) : ''}
                onChange={(e) => setNewVariable({ ...newVariable, defaultValue: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Default value"
              />
            </div>
            
            <div>
              <input
                type="text"
                value={newVariable.description || ''}
                onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Description"
              />
            </div>
            
            <Button 
              onClick={handleAddVariable}
              className="w-full flex items-center justify-center"
              disabled={!newVariable.name}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Variable
            </Button>
          </div>
        </div>
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
              Variables can be used throughout your workflow by prefixing them with $, e.g. $approver
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowVariablesPanel;
