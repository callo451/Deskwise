import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ActionNode as ActionNodeType } from '../../../types/workflowAutomation';

const ActionNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as ActionNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-green-500' : 'border-green-200'
    } bg-green-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-green-800">{nodeData.label || 'Action'}</div>
          <div className="text-xs text-green-600">{nodeData.description || 'Perform an action'}</div>
          {nodeData.actionType && (
            <div className="text-xs text-green-700 mt-1 bg-green-100 px-2 py-0.5 rounded-full inline-block">
              {nodeData.actionType}
            </div>
          )}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#10b981', width: '8px', height: '8px' }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#10b981', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default memo(ActionNode);
