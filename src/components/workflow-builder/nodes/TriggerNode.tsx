import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TriggerNode as TriggerNodeType } from '../../../types/workflowAutomation';

const TriggerNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-blue-500' : 'border-blue-200'
    } bg-blue-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-blue-800">{nodeData.label || 'Trigger'}</div>
          <div className="text-xs text-blue-600">{nodeData.description || 'Start of workflow'}</div>
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#3b82f6', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default memo(TriggerNode);
