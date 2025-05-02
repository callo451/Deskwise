import React, { useState, useEffect } from 'react';
import { 
  getWorkflowExecutions,
  getExecutionDetails,
  getWorkflow
} from '../../services/workflowAutomationService';
import { 
  ExecutionStatus,
  WorkflowExecution,
  WorkflowExecutionLog,
  Workflow
} from '../../types/workflowAutomation';
import { Button } from '../ui/Button';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import WorkflowExecutionVisualizer from './WorkflowExecutionVisualizer';

interface WorkflowExecutionHistoryProps {
  workflowId: string;
  onClose: () => void;
}

export const WorkflowExecutionHistory: React.FC<WorkflowExecutionHistoryProps> = ({
  workflowId,
  onClose
}) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [executionDetails, setExecutionDetails] = useState<{
    execution: WorkflowExecution;
    logs: WorkflowExecutionLog[];
  } | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<'logs' | 'visualizer'>('logs');

  useEffect(() => {
    fetchExecutions();
    fetchWorkflow();
  }, [workflowId, page]);

  useEffect(() => {
    if (selectedExecutionId) {
      fetchExecutionDetails(selectedExecutionId);
    }
  }, [selectedExecutionId]);

  const fetchExecutions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWorkflowExecutions(workflowId, page, limit);
      setExecutions(result.executions);
      setTotalExecutions(result.total);
    } catch (error: any) {
      setError(error.message || 'Failed to load executions');
      console.error('Error fetching executions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutionDetails = async (executionId: string) => {
    try {
      const details = await getExecutionDetails(executionId);
      setExecutionDetails(details);
    } catch (error: any) {
      console.error('Error fetching execution details:', error);
    }
  };

  const fetchWorkflow = async () => {
    try {
      const workflowData = await getWorkflow(workflowId);
      setWorkflow(workflowData);
    } catch (error: any) {
      console.error('Failed to load workflow:', error);
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.floor(durationMs / 1000)}s`;
    } else if (durationMs < 3600000) {
      return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
    } else {
      return `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`;
    }
  };

  const handleSelectExecution = (execution: WorkflowExecution) => {
    setSelectedExecutionId(execution.id);
  };

  const getLogLevelClass = (status: string) => {
    switch (status) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Workflow Execution History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading && !selectedExecutionId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500">
              {error}
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Executions List */}
              <div className="w-full md:w-1/4 border-r border-gray-200 overflow-y-auto">
                {executions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No executions found for this workflow
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {executions.map((execution) => (
                      <li 
                        key={execution.id} 
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedExecutionId === execution.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectExecution(execution)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(execution.status)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(execution.started_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Duration: {formatDuration(execution.started_at, execution.completed_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(execution.status)}`}>
                            {execution.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Pagination */}
                {totalExecutions > limit && (
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between">
                      <Button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700">
                        Page {page} of {Math.ceil(totalExecutions / limit)}
                      </span>
                      <Button
                        onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalExecutions / limit)))}
                        disabled={page === Math.ceil(totalExecutions / limit)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Execution Details */}
              <div className="w-full md:w-3/4 overflow-hidden flex flex-col">
                {selectedExecutionId && executionDetails ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Execution Details
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewMode('logs')}
                            className={`p-2 rounded-md ${viewMode === 'logs' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="View Logs"
                          >
                            <ClockIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setViewMode('visualizer')}
                            className={`p-2 rounded-md ${viewMode === 'visualizer' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="View Flow Visualization"
                            disabled={!workflow}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(executionDetails.execution.status)}`}>
                            {executionDetails.execution.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Started</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(executionDetails.execution.started_at)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Completed</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {executionDetails.execution.completed_at 
                                ? formatDate(executionDetails.execution.completed_at)
                                : 'Not completed'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Duration</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDuration(
                                executionDetails.execution.started_at,
                                executionDetails.execution.completed_at
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Trigger ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 truncate">
                              {executionDetails.execution.trigger_id || 'No trigger ID'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      {viewMode === 'logs' ? (
                        <div className="p-4 h-full overflow-y-auto">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Execution Logs</h4>
                          
                          {executionDetails.logs.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                              No logs available for this execution
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {executionDetails.logs.map((log, index) => (
                                <div 
                                  key={index} 
                                  className={`p-3 rounded-md text-sm ${getLogLevelClass(log.status)}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                      {log.status}
                                    </span>
                                  </div>
                                  <p className="mt-1">{log.message}</p>
                                  {log.node_id && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Node: {log.node_id}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {executionDetails.execution.error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                              <h4 className="text-sm font-medium text-red-800">Error</h4>
                              <p className="mt-1 text-sm text-red-700">{executionDetails.execution.error}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full">
                          {workflow ? (
                            <WorkflowExecutionVisualizer 
                              workflow={workflow} 
                              execution={executionDetails.execution}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              Loading workflow visualization...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    {selectedExecutionId ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    ) : (
                      <p>Select an execution to view details</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowExecutionHistory;
