import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LoopNode as LoopNodeType } from '../../../types/workflowAutomation';

const LoopNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as LoopNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-orange-500' : 'border-orange-200'
    } bg-orange-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-orange-800">{nodeData.label || 'Loop'}</div>
          <div className="text-xs text-orange-600">{nodeData.description || 'Iterate over items'}</div>
          {nodeData.config?.collection && (
            <div className="text-xs text-orange-700 mt-1 bg-orange-100 px-2 py-0.5 rounded-full inline-block">
              Collection: {nodeData.config.collection}
            </div>
          )}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#f97316', width: '8px', height: '8px' }}
      />
      
      {/* Output handles */}
      <div className="mt-2 flex justify-between text-xs text-orange-700">
        <div>Loop</div>
        <div>Exit</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop"
        style={{ background: '#f59e0b', width: '8px', height: '8px', left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        style={{ background: '#8b5cf6', width: '8px', height: '8px', left: '70%' }}
      />
    </div>
  );
};

export default memo(LoopNode);
