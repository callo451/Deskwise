import React from 'react';
import { Node } from 'reactflow';
import { 
  JunctionNode,
  JunctionType,
  WorkflowVariable
} from '../../types/workflowAutomation';

interface JunctionPropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: Partial<JunctionNode>) => void;
  variables: WorkflowVariable[];
}

export const JunctionPropertiesPanel: React.FC<JunctionPropertiesPanelProps> = ({
  node,
  onUpdate,
  variables
}) => {
  const junctionType = node.data.junctionType || 'and';
  
  const handleJunctionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(node.id, { junctionType: e.target.value as JunctionType });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Junction Type
        </label>
        <select
          value={junctionType}
          onChange={handleJunctionTypeChange}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="split">Split</option>
          <option value="merge">Merge</option>
        </select>
      </div>
      
      {(junctionType === 'split') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Branches
          </label>
          <input
            type="number"
            min="2"
            max="5"
            value={node.data.config?.branches || 2}
            onChange={(e) => onUpdate(node.id, { 
              config: { ...node.data.config, branches: parseInt(e.target.value) || 2 }
            })}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
      )}
      
      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-indigo-700">
              {junctionType === 'and' && 'AND junction waits for all incoming paths to complete before continuing.'}
              {junctionType === 'or' && 'OR junction continues when any incoming path is completed.'}
              {junctionType === 'split' && 'Split junction creates multiple parallel paths of execution.'}
              {junctionType === 'merge' && 'Merge junction combines multiple paths without waiting.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JunctionPropertiesPanel;
