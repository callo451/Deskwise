import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  WorkflowExecution, 
  WorkflowExecutionLog, 
  Workflow,
  WorkflowNode,
  WorkflowConnection
} from '../../types/workflowAutomation';
import { getWorkflowExecutionLogs } from '../../services/workflowAutomationService';

// Import custom node components
import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import LoopNode from './nodes/LoopNode';
import JunctionNode from './nodes/JunctionNode';

// Node types mapping for ReactFlow
const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  loop: LoopNode,
  junction: JunctionNode
};

interface WorkflowExecutionVisualizerProps {
  workflow: Workflow;
  execution: WorkflowExecution;
}

export const WorkflowExecutionVisualizer: React.FC<WorkflowExecutionVisualizerProps> = ({
  workflow,
  execution
}) => {
  const [logs, setLogs] = useState<WorkflowExecutionLog[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load execution logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const executionLogs = await getWorkflowExecutionLogs(execution.id);
        setLogs(executionLogs);
      } catch (error) {
        console.error('Failed to fetch execution logs:', error);
      }
    };

    fetchLogs();
  }, [execution.id]);

  // Initialize nodes and edges from workflow
  useEffect(() => {
    if (workflow) {
      // Convert workflow nodes to ReactFlow nodes
      const flowNodes = workflow.nodes.map((node: WorkflowNode) => ({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: { ...node },
        style: { opacity: 0.6 } // Start with faded nodes
      }));

      // Convert workflow connections to ReactFlow edges
      const flowEdges = workflow.connections.map((connection: WorkflowConnection) => ({
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        label: connection.label,
        style: { stroke: '#ccc', opacity: 0.6 } // Start with faded edges
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [workflow, setNodes, setEdges]);

  // Update visualization based on current log
  useEffect(() => {
    if (logs.length === 0 || currentLogIndex >= logs.length) return;

    const currentLog = logs[currentLogIndex];
    const executionPath = currentLog.execution_path || [];
    const activeNodeId = currentLog.node_id;

    // Update nodes to highlight the active execution path
    setNodes(nodes => nodes.map(node => {
      const isActive = node.id === activeNodeId;
      const isInPath = executionPath.includes(node.id);
      
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isInPath ? 1 : 0.6,
          boxShadow: isActive ? '0 0 10px 5px rgba(255, 165, 0, 0.75)' : 'none',
          border: isActive ? '2px solid orange' : node.style?.border
        }
      };
    }));

    // Update edges to highlight the active execution path
    setEdges(edges => edges.map(edge => {
      const isInPath = executionPath.some((nodeId, index) => {
        return nodeId === edge.source && index < executionPath.length - 1 && executionPath[index + 1] === edge.target;
      });
      
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isInPath ? '#ff9900' : '#ccc',
          opacity: isInPath ? 1 : 0.6,
          strokeWidth: isInPath ? 3 : 1
        },
        animated: isInPath
      };
    }));
  }, [currentLogIndex, logs, setNodes, setEdges]);

  // Auto-play functionality
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying && currentLogIndex < logs.length - 1) {
      timer = setTimeout(() => {
        setCurrentLogIndex(prev => prev + 1);
      }, 1000 / playbackSpeed);
    } else if (currentLogIndex >= logs.length - 1) {
      setIsPlaying(false);
    }
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentLogIndex, logs.length, playbackSpeed]);

  // Handle playback controls
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStep = (step: number) => {
    const newIndex = currentLogIndex + step;
    if (newIndex >= 0 && newIndex < logs.length) {
      setCurrentLogIndex(newIndex);
    }
  };
  const handleReset = () => setCurrentLogIndex(0);
  const handleSpeedChange = (speed: number) => setPlaybackSpeed(speed);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
        <div className="text-sm font-medium">
          Execution: {execution.id.substring(0, 8)}... 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            execution.status === 'completed' ? 'bg-green-100 text-green-800' :
            execution.status === 'failed' ? 'bg-red-100 text-red-800' :
            execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {execution.status}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-gray-200"
            title="Reset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={() => handleStep(-1)}
            disabled={currentLogIndex <= 0}
            className={`p-1 rounded hover:bg-gray-200 ${currentLogIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Previous Step"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-1 rounded hover:bg-gray-200"
              title="Pause"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={currentLogIndex >= logs.length - 1}
              className={`p-1 rounded hover:bg-gray-200 ${currentLogIndex >= logs.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => handleStep(1)}
            disabled={currentLogIndex >= logs.length - 1}
            className={`p-1 rounded hover:bg-gray-200 ${currentLogIndex >= logs.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Next Step"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <select
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="text-xs bg-white border rounded px-1 py-0.5"
            title="Playback Speed"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>
        
        <div className="text-xs text-gray-500">
          Step {currentLogIndex + 1} of {logs.length}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/4 h-full">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        <div className="w-1/4 h-full overflow-y-auto border-l p-2">
          <h3 className="font-medium text-sm mb-2">Execution Logs</h3>
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index}
                className={`p-2 text-xs rounded ${
                  index === currentLogIndex ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                } ${
                  log.level === 'error' ? 'text-red-700' :
                  log.level === 'warning' ? 'text-yellow-700' : 'text-gray-700'
                }`}
                onClick={() => setCurrentLogIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {log.level}
                  </span>
                </div>
                <div className="mt-1">{log.message}</div>
                {log.node_id && (
                  <div className="mt-1 text-gray-500">
                    Node: {log.node_id.substring(0, 8)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowExecutionVisualizer;
