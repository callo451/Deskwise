import React from 'react';
import { Node } from 'reactflow';
import { 
  LoopNode,
  WorkflowVariable
} from '../../types/workflowAutomation';

interface LoopPropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: Partial<LoopNode>) => void;
  variables: WorkflowVariable[];
}

export const LoopPropertiesPanel: React.FC<LoopPropertiesPanelProps> = ({
  node,
  onUpdate,
  variables
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Collection
        </label>
        <input
          type="text"
          value={node.data.config?.collection || ''}
          onChange={(e) => onUpdate(node.id, { 
            config: { ...node.data.config, collection: e.target.value }
          })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          placeholder="Collection variable (e.g. $tickets)"
        />
        <p className="text-xs text-gray-500 mt-1">
          The collection to iterate over. This should be an array variable.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Variable
        </label>
        <input
          type="text"
          value={node.data.config?.variable || ''}
          onChange={(e) => onUpdate(node.id, { 
            config: { ...node.data.config, variable: e.target.value }
          })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          placeholder="Variable name (e.g. ticket)"
        />
        <p className="text-xs text-gray-500 mt-1">
          The variable name to use for each item in the collection.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Iterations
        </label>
        <input
          type="number"
          min="1"
          value={node.data.config?.maxIterations || 100}
          onChange={(e) => onUpdate(node.id, { 
            config: { ...node.data.config, maxIterations: parseInt(e.target.value) || 100 }
          })}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum number of iterations to prevent infinite loops.
        </p>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              The loop node has two outputs: "Loop" continues the loop with the next item, and "Exit" is taken after all items are processed.
            </p>
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
              Example: If your collection is "$tickets" and your variable is "ticket", you can use "$ticket.id" in subsequent nodes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoopPropertiesPanel;
