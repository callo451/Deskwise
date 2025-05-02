import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { JunctionNode as JunctionNodeType } from '../../../types/workflowAutomation';

const JunctionNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as JunctionNodeType;
  
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${
      selected ? 'border-indigo-500' : 'border-indigo-200'
    } bg-indigo-50 min-w-[180px]`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-indigo-800">{nodeData.label || 'Junction'}</div>
          <div className="text-xs text-indigo-600">{nodeData.description || 'Branch or merge paths'}</div>
          {nodeData.junctionType && (
            <div className="text-xs text-indigo-700 mt-1 bg-indigo-100 px-2 py-0.5 rounded-full inline-block">
              {nodeData.junctionType}
            </div>
          )}
        </div>
      </div>
      
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input1"
        style={{ background: '#6366f1', width: '8px', height: '8px', left: '30%' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="input2"
        style={{ background: '#6366f1', width: '8px', height: '8px', left: '70%' }}
      />
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output1"
        style={{ background: '#6366f1', width: '8px', height: '8px', left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output2"
        style={{ background: '#6366f1', width: '8px', height: '8px', left: '70%' }}
      />
    </div>
  );
};

export default memo(JunctionNode);
