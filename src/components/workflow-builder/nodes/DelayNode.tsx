import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DelayNode as DelayNodeType } from '../../../types/workflowAutomation';

const DelayNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as DelayNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-purple-500' : 'border-purple-200'
    } bg-purple-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-purple-800">{nodeData.label || 'Delay'}</div>
          <div className="text-xs text-purple-600">{nodeData.description || 'Wait for a period'}</div>
          {nodeData.delayType && (
            <div className="text-xs text-purple-700 mt-1 bg-purple-100 px-2 py-0.5 rounded-full inline-block">
              {nodeData.delayType}
            </div>
          )}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#8b5cf6', width: '8px', height: '8px' }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#8b5cf6', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default memo(DelayNode);
