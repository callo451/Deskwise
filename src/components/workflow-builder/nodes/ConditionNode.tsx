import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ConditionNode as ConditionNodeType } from '../../../types/workflowAutomation';

const ConditionNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as ConditionNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-yellow-500' : 'border-yellow-200'
    } bg-yellow-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-yellow-800">{nodeData.label || 'Condition'}</div>
          <div className="text-xs text-yellow-600">{nodeData.description || 'Check a condition'}</div>
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#eab308', width: '8px', height: '8px' }}
      />
      
      {/* Output handles */}
      <div className="mt-2 flex justify-between text-xs text-yellow-700">
        <div>True</div>
        <div>False</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ background: '#10b981', width: '8px', height: '8px', left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ background: '#ef4444', width: '8px', height: '8px', left: '70%' }}
      />
    </div>
  );
};

export default memo(ConditionNode);
