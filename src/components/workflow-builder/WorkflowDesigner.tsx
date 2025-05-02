import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection,
  NodeType,
  ModuleType
} from '../../types/workflowAutomation';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Import custom node types
import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import LoopNode from './nodes/LoopNode';
import JunctionNode from './nodes/JunctionNode';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { WorkflowPropertiesPanel } from './WorkflowPropertiesPanel';
import { WorkflowVariablesPanel } from './WorkflowVariablesPanel';
import ActionConfigurator from './ActionConfigurator';
import TriggerSelector from './TriggerSelector';
import ConditionConfigurator from './ConditionConfigurator';
import DelayConfigurator from './DelayConfigurator';
import LoopConfigurator from './LoopConfigurator';

// Define node types for ReactFlow
const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  loop: LoopNode,
  junction: JunctionNode
};

// Define edge types with custom styling
const edgeTypes = {};

interface WorkflowDesignerProps {
  workflow: Workflow;
  onSave: (workflow: Partial<Workflow>) => void;
  onCancel: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflow,
  onSave,
  onCancel
}) => {
  // Convert workflow nodes to ReactFlow nodes
  const initialNodes = workflow.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: { ...node },
    draggable: true,
    selectable: true
  }));

  // Convert workflow connections to ReactFlow edges
  const initialEdges = workflow.connections.map(conn => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    type: 'smoothstep',
    animated: conn.type === 'conditional_true',
    style: {
      stroke: conn.type === 'conditional_true' ? '#10b981' : 
              conn.type === 'conditional_false' ? '#ef4444' : 
              conn.type === 'loop_complete' ? '#f59e0b' :
              conn.type === 'loop_exit' ? '#8b5cf6' : '#64748b',
      strokeWidth: 2
    },
    label: conn.label,
    data: { type: conn.type, condition: conn.condition }
  }));

  // State for ReactFlow nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // State for the currently selected node
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // State for the currently open panel
  const [activePanel, setActivePanel] = useState<'none' | 'node' | 'workflow' | 'variables'>('none');
  
  // State for node configurators
  const [showActionConfigurator, setShowActionConfigurator] = useState<boolean>(false);
  const [showTriggerSelector, setShowTriggerSelector] = useState<boolean>(false);
  const [showConditionConfigurator, setShowConditionConfigurator] = useState<boolean>(false);
  const [showDelayConfigurator, setShowDelayConfigurator] = useState<boolean>(false);
  const [showLoopConfigurator, setShowLoopConfigurator] = useState<boolean>(false);
  
  // State for workflow properties
  const [workflowProperties, setWorkflowProperties] = useState({
    name: workflow.name,
    description: workflow.description || '',
    module: workflow.module,
    status: workflow.status
  });
  
  // State for workflow variables
  const [workflowVariables, setWorkflowVariables] = useState(workflow.variables || []);
  
  // Reference to the ReactFlow instance
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Handle node configuration
  const handleConfigureNode = useCallback((nodeType: string) => {
    if (!selectedNode) return;
    
    switch (nodeType) {
      case 'action':
        setShowActionConfigurator(true);
        break;
      case 'trigger':
        setShowTriggerSelector(true);
        break;
      case 'condition':
        setShowConditionConfigurator(true);
        break;
      case 'delay':
        setShowDelayConfigurator(true);
        break;
      case 'loop':
        setShowLoopConfigurator(true);
        break;
      default:
        break;
    }
  }, [selectedNode]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setActivePanel('node');
  }, []);

  // Handle background click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setActivePanel('none');
  }, []);

  // Handle node changes (position, etc.)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Handle new connections between nodes
  const handleConnect = useCallback((connection: Connection) => {
    // Create a unique ID for the new edge
    const edgeId = `edge_${Date.now()}`;
    
    // Determine the connection type based on the source node
    const sourceNode = nodes.find(node => node.id === connection.source);
    let connectionType = 'standard';
    
    if (sourceNode?.type === 'condition') {
      // For condition nodes, check if this is a true or false path
      // This is a simplified example - in a real app, you'd have more logic here
      const existingEdges = edges.filter(
        edge => edge.source === connection.source
      );
      
      if (existingEdges.length === 0) {
        connectionType = 'conditional_true';
      } else if (existingEdges.length === 1) {
        connectionType = 'conditional_false';
      }
    } else if (sourceNode?.type === 'loop') {
      // For loop nodes, check if this is a complete or exit path
      const existingEdges = edges.filter(
        edge => edge.source === connection.source
      );
      
      if (existingEdges.length === 0) {
        connectionType = 'loop_complete';
      } else if (existingEdges.length === 1) {
        connectionType = 'loop_exit';
      }
    }
    
    const newEdge = {
      id: edgeId,
      source: connection.source || '',
      target: connection.target || '',
      type: 'smoothstep',
      animated: connectionType === 'conditional_true',
      style: {
        stroke: connectionType === 'conditional_true' ? '#10b981' : 
                connectionType === 'conditional_false' ? '#ef4444' : 
                connectionType === 'loop_complete' ? '#f59e0b' :
                connectionType === 'loop_exit' ? '#8b5cf6' : '#64748b',
        strokeWidth: 2
      },
      data: { type: connectionType }
    };
    
    setEdges(eds => addEdge(newEdge, eds));
  }, [nodes, edges, setEdges]);

  // Handle drag over for adding new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop for adding new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow/type') as NodeType;
      const moduleType = event.dataTransfer.getData('application/reactflow/module') as ModuleType;
      
      // Check if the dropped element is valid
      if (!nodeType) return;

      // Get the position where the node was dropped
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create a unique ID for the new node
      const newNodeId = `${nodeType}_${Date.now()}`;
      
      // Create default labels based on node type
      let label = 'New Node';
      let description = '';
      
      switch (nodeType) {
        case 'trigger':
          label = 'Start';
          description = 'Workflow trigger';
          break;
        case 'condition':
          label = 'Condition';
          description = 'Check a condition';
          break;
        case 'action':
          label = 'Action';
          description = 'Perform an action';
          break;
        case 'delay':
          label = 'Delay';
          description = 'Wait for a period';
          break;
        case 'loop':
          label = 'Loop';
          description = 'Iterate over items';
          break;
        case 'junction':
          label = 'Junction';
          description = 'Branch or merge paths';
          break;
      }

      // Create the new node
      const newNode: WorkflowNode = {
        id: newNodeId,
        type: nodeType,
        moduleType: moduleType || undefined,
        label,
        description,
        position,
        config: {}
      };

      // Add the new node to the flow
      setNodes(nds => [
        ...nds,
        {
          id: newNodeId,
          type: nodeType,
          position,
          data: { ...newNode },
          draggable: true,
          selectable: true
        },
      ]);
      
      // Select the new node
      setSelectedNode({
        id: newNodeId,
        type: nodeType,
        position,
        data: { ...newNode },
        draggable: true,
        selectable: true
      });
      
      setActivePanel('node');
    },
    [reactFlowInstance, setNodes]
  );

  // Handle node updates from the properties panel
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, ...updates };
          return { ...node, data: updatedData };
        }
        return node;
      })
    );
    
    // Update the selected node if it's the one being updated
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => {
        if (!prev) return null;
        return {
          ...prev,
          data: { ...prev.data, ...updates }
        };
      });
    }
  }, [setNodes, selectedNode]);

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    
    // Remove any connected edges
    setEdges(eds => eds.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Clear selection if the deleted node was selected
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
      setActivePanel('none');
    }
  }, [setNodes, setEdges, selectedNode]);

  // Handle edge deletion
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(eds => eds.filter(edge => edge.id !== edgeId));
  }, [setEdges]);

  // Handle workflow save
  const handleSave = useCallback(() => {
    // Convert ReactFlow nodes back to workflow nodes
    const workflowNodes = nodes.map(node => ({
      id: node.id,
      type: node.data.type,
      moduleType: node.data.moduleType,
      label: node.data.label,
      description: node.data.description,
      position: node.position,
      config: node.data.config || {},
      style: node.data.style
    }));

    // Convert ReactFlow edges back to workflow connections
    const workflowConnections = edges.map(edge => ({
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      type: edge.data?.type || 'standard',
      label: edge.label,
      condition: edge.data?.condition
    }));

    // Create the updated workflow object
    const updatedWorkflow: Partial<Workflow> = {
      ...workflow,
      name: workflowProperties.name,
      description: workflowProperties.description,
      module: workflowProperties.module,
      status: workflowProperties.status,
      nodes: workflowNodes,
      connections: workflowConnections,
      variables: workflowVariables
    };

    // Call the onSave callback with the updated workflow
    onSave(updatedWorkflow);
  }, [workflow, nodes, edges, workflowProperties, workflowVariables, onSave]);

  // Node palette for dragging new nodes onto the canvas
  const renderNodePalette = () => (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Nodes</h3>
      <div className="grid grid-cols-2 gap-2">
        <div
          className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'trigger');
          }}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Trigger</span>
        </div>
        
        <div
          className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'condition');
          }}
        >
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Condition</span>
        </div>
        
        <div
          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'action');
          }}
        >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Action</span>
        </div>
        
        <div
          className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'delay');
          }}
        >
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Delay</span>
        </div>
        
        <div
          className="flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'loop');
          }}
        >
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-xs font-medium">Loop</span>
        </div>
        
        <div
          className="flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md p-2 cursor-grab"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow/type', 'junction');
          }}
        >
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          <span className="text-xs font-medium">Junction</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-200px)] flex">
      <div className="w-64 bg-gray-50 p-4 border-r overflow-y-auto">
        {renderNodePalette()}
        
        <div className="mt-6 space-y-2">
          <button
            onClick={() => { setActivePanel('workflow'); setSelectedNode(null); }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activePanel === 'workflow' 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Workflow Properties
          </button>
          
          <button
            onClick={() => { setActivePanel('variables'); setSelectedNode(null); }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activePanel === 'variables' 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Variables
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              connectionLineType={ConnectionLineType.SmoothStep}
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background color="#aaa" gap={16} />
              <Controls />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.type === 'trigger') return '#3b82f6';
                  if (n.type === 'condition') return '#eab308';
                  if (n.type === 'action') return '#10b981';
                  if (n.type === 'delay') return '#8b5cf6';
                  if (n.type === 'loop') return '#f97316';
                  if (n.type === 'junction') return '#6366f1';
                  return '#6b7280';
                }}
                nodeColor={(n) => {
                  if (n.type === 'trigger') return '#93c5fd';
                  if (n.type === 'condition') return '#fde68a';
                  if (n.type === 'action') return '#a7f3d0';
                  if (n.type === 'delay') return '#c4b5fd';
                  if (n.type === 'loop') return '#fdba74';
                  if (n.type === 'junction') return '#a5b4fc';
                  return '#d1d5db';
                }}
                nodeBorderRadius={10}
              />
              <Panel position="bottom-center">
                <div className="bg-white p-2 rounded-lg shadow-lg flex space-x-2">
                  <Button 
                    onClick={handleSave}
                    className="flex items-center"
                  >
                    <CheckIcon className="h-5 w-5 mr-1" />
                    Save
                  </Button>
                  <Button 
                    onClick={onCancel}
                    variant="outline"
                    className="flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
      
      {activePanel === 'node' && selectedNode && (
        <div className="w-80 bg-gray-50 p-4 border-l overflow-y-auto">
          <NodePropertiesPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleDeleteNode}
            variables={workflowVariables}
            onConfigureNode={handleConfigureNode}
          />
        </div>
      )}
      
      {activePanel === 'workflow' && (
        <div className="w-80 bg-gray-50 p-4 border-l overflow-y-auto">
          <WorkflowPropertiesPanel
            properties={workflowProperties}
            onChange={setWorkflowProperties}
          />
        </div>
      )}
      
      {activePanel === 'variables' && (
        <div className="w-80 bg-gray-50 p-4 border-l overflow-y-auto">
          <WorkflowVariablesPanel
            variables={workflowVariables}
            onChange={setWorkflowVariables}
          />
        </div>
      )}
    
      {/* Action Configurator Modal */}
      {showActionConfigurator && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ActionConfigurator
              moduleType={selectedNode.data.moduleType || 'tickets'}
              initialActionType={selectedNode.data.config?.actionType}
              initialConfig={selectedNode.data.config}
              onActionConfigured={(actionType, config) => {
                // Update the node with the configured action
                handleNodeUpdate(selectedNode.id, {
                  config: {
                    ...selectedNode.data.config,
                    actionType,
                    ...config
                  }
                });
                setShowActionConfigurator(false);
              }}
              onCancel={() => setShowActionConfigurator(false)}
            />
          </div>
        </div>
      )}

      {/* Trigger Selector Modal */}
      {showTriggerSelector && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TriggerSelector
              moduleType={selectedNode.data.moduleType || 'tickets'}
              initialTriggerType={selectedNode.data.config?.triggerType}
              initialConfig={selectedNode.data.config}
              onTriggerConfigured={(triggerType, config) => {
                // Update the node with the configured trigger
                handleNodeUpdate(selectedNode.id, {
                  config: {
                    ...selectedNode.data.config,
                    triggerType,
                    ...config
                  }
                });
                setShowTriggerSelector(false);
              }}
              onCancel={() => setShowTriggerSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Condition Configurator Modal */}
      {showConditionConfigurator && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ConditionConfigurator
              moduleType={selectedNode.data.moduleType || 'tickets'}
              initialConditionType={selectedNode.data.config?.conditionType}
              initialConfig={selectedNode.data.config}
              variables={workflowVariables}
              onConditionConfigured={(conditionType, config) => {
                // Update the node with the configured condition
                handleNodeUpdate(selectedNode.id, {
                  config: {
                    ...selectedNode.data.config,
                    conditionType,
                    ...config
                  }
                });
                setShowConditionConfigurator(false);
              }}
              onCancel={() => setShowConditionConfigurator(false)}
            />
          </div>
        </div>
      )}

      {/* Delay Configurator Modal */}
      {showDelayConfigurator && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DelayConfigurator
              initialDelayType={selectedNode.data.config?.delayType}
              initialConfig={selectedNode.data.config}
              variables={workflowVariables}
              onDelayConfigured={(delayType, config) => {
                // Update the node with the configured delay
                handleNodeUpdate(selectedNode.id, {
                  config: {
                    ...selectedNode.data.config,
                    delayType,
                    ...config
                  }
                });
                setShowDelayConfigurator(false);
              }}
              onCancel={() => setShowDelayConfigurator(false)}
            />
          </div>
        </div>
      )}

      {/* Loop Configurator Modal */}
      {showLoopConfigurator && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <LoopConfigurator
              initialLoopType={selectedNode.data.config?.loopType}
              initialConfig={selectedNode.data.config}
              variables={workflowVariables}
              onLoopConfigured={(loopType, config) => {
                // Update the node with the configured loop
                handleNodeUpdate(selectedNode.id, {
                  config: {
                    ...selectedNode.data.config,
                    loopType,
                    ...config
                  }
                });
                setShowLoopConfigurator(false);
              }}
              onCancel={() => setShowLoopConfigurator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
