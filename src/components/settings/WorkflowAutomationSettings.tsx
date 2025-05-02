import React, { useState, useEffect } from 'react';
import { 
  getWorkflows, 
  createWorkflow, 
  updateWorkflow, 
  deleteWorkflow,
  setWorkflowStatus,
  cloneWorkflow,
  getWorkflowTemplates
} from '../../services/workflowAutomationService';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { 
  Workflow, 
  WorkflowStatus,
  ModuleType
} from '../../types/workflowAutomation';
import { WorkflowDesigner } from '../workflow-builder/WorkflowDesigner';
import { WorkflowTemplateSelector } from '../workflow-builder/WorkflowTemplateSelector';
import { WorkflowExecutionHistory } from '../workflow-builder/WorkflowExecutionHistory';

const WorkflowAutomationSettings: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExecutionHistoryOpen, setIsExecutionHistoryOpen] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Partial<Workflow> | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<ModuleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchWorkflows();
    }
  }, [moduleFilter, statusFilter]);

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated and has proper role
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setAuthError('Authentication error: ' + userError.message);
        return;
      }
      
      if (!userData?.user) {
        setAuthError('You must be logged in to access this page');
        return;
      }

      // Get user role from the users table
      const { data: userDetails, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single();
      
      if (roleError) {
        setAuthError('Error fetching user role: ' + roleError.message);
        return;
      }

      setUserRole(userDetails?.role || null);
      
      // Check if user has admin or manager role
      if (userDetails?.role !== 'admin' && userDetails?.role !== 'manager') {
        setAuthError('You must be an admin or manager to manage workflows');
        return;
      }

      // User is authenticated and has proper role, fetch data
      await Promise.all([
        fetchWorkflows(),
        fetchTemplates()
      ]);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      let data;
      if (moduleFilter === 'all' && statusFilter === 'all') {
        data = await getWorkflows();
      } else if (moduleFilter === 'all') {
        data = await getWorkflows(undefined, statusFilter as WorkflowStatus);
      } else if (statusFilter === 'all') {
        data = await getWorkflows(moduleFilter as ModuleType);
      } else {
        data = await getWorkflows(moduleFilter as ModuleType, statusFilter as WorkflowStatus);
      }
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await getWorkflowTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
    }
  };

  const handleOpenModal = (workflow?: Workflow) => {
    if (workflow) {
      setCurrentWorkflow(workflow);
    } else {
      setCurrentWorkflow({
        name: 'New Workflow',
        description: '',
        status: 'draft',
        module: 'tickets',
        nodes: [],
        connections: [],
        variables: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentWorkflow(null);
  };

  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false);
  };

  const handleOpenExecutionHistory = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsExecutionHistoryOpen(true);
  };

  const handleCloseExecutionHistory = () => {
    setIsExecutionHistoryOpen(false);
    setSelectedWorkflowId(null);
  };

  const handleSave = async (workflow: Partial<Workflow>) => {
    try {
      // Check authentication status before saving
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        alert('You must be logged in to save workflows');
        return;
      }

      if (workflow.id) {
        await updateWorkflow(workflow.id, workflow);
      } else {
        await createWorkflow(workflow);
      }
      
      await fetchWorkflows();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      
      // Display a more helpful error message
      if (error.message && error.message.includes('row-level security policy')) {
        alert('Permission denied: You do not have the required role (admin or manager) to save workflows');
      } else {
        alert(`Error saving workflow: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      try {
        await deleteWorkflow(id);
        fetchWorkflows();
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const handleClone = async (id: string) => {
    try {
      await cloneWorkflow(id);
      fetchWorkflows();
    } catch (error) {
      console.error('Error cloning workflow:', error);
    }
  };

  const handleStatusChange = async (id: string, status: WorkflowStatus) => {
    try {
      await setWorkflowStatus(id, status);
      fetchWorkflows();
    } catch (error) {
      console.error('Error changing workflow status:', error);
    }
  };

  const handleCreateFromTemplate = async (templateId: string, name: string) => {
    try {
      await createWorkflowFromTemplate(templateId, name);
      fetchWorkflows();
      handleCloseTemplateModal();
    } catch (error) {
      console.error('Error creating workflow from template:', error);
    }
  };

  const getModuleLabel = (module: ModuleType): string => {
    switch (module) {
      case 'tickets': return 'Tickets';
      case 'problems': return 'Problems';
      case 'changes': return 'Changes';
      case 'improvements': return 'Improvements';
      case 'knowledge': return 'Knowledge Base';
      case 'service_catalog': return 'Service Catalog';
      case 'users': return 'Users';
      case 'notifications': return 'Notifications';
      case 'external': return 'External';
      default: return module;
    }
  };

  const getStatusBadgeClass = (status: WorkflowStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {authError && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Authentication Error</h3>
            <p className="text-red-700">{authError}</p>
            {userRole && userRole !== 'admin' && userRole !== 'manager' && (
              <p className="mt-2 text-sm text-red-700">
                Your current role is <strong>{userRole}</strong>. You need admin or manager role to manage workflows.
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Workflow Automation</h2>
            
            {!authError && (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleOpenTemplateModal} 
                  variant="outline"
                  className="flex items-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Use Template
                </Button>
                <Button onClick={() => handleOpenModal()} className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Workflow
                </Button>
              </div>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label htmlFor="module-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Module
              </label>
              <select
                id="module-filter"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as ModuleType | 'all')}
                className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              >
                <option value="all">All Modules</option>
                <option value="tickets">Tickets</option>
                <option value="problems">Problems</option>
                <option value="changes">Changes</option>
                <option value="improvements">Improvements</option>
                <option value="knowledge">Knowledge Base</option>
                <option value="service_catalog">Service Catalog</option>
                <option value="users">Users</option>
                <option value="notifications">Notifications</option>
                <option value="external">External</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
                className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500 mb-4">No workflows found.</p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={handleOpenTemplateModal}
                  variant="outline"
                  className="flex items-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-1" />
                  Use Template
                </Button>
                <Button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Create First Workflow
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                            {workflow.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getModuleLabel(workflow.module)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusBadgeClass(workflow.status)
                        }`}>
                          {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(workflow.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenExecutionHistory(workflow.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title="View Execution History"
                          >
                            <ChartBarIcon className="h-5 w-5" />
                          </button>
                          
                          {workflow.status === 'draft' || workflow.status === 'inactive' ? (
                            <button
                              onClick={() => handleStatusChange(workflow.id, 'active')}
                              className="text-green-500 hover:text-green-700"
                              title="Activate Workflow"
                            >
                              <PlayIcon className="h-5 w-5" />
                            </button>
                          ) : workflow.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(workflow.id, 'inactive')}
                              className="text-yellow-500 hover:text-yellow-700"
                              title="Deactivate Workflow"
                            >
                              <StopIcon className="h-5 w-5" />
                            </button>
                          ) : null}
                          
                          <button
                            onClick={() => handleClone(workflow.id)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Clone Workflow"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenModal(workflow)}
                            className="text-primary hover:text-primary-dark"
                            title="Edit Workflow"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(workflow.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Workflow"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for Workflow Designer */}
      {isModalOpen && currentWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {currentWorkflow.id ? 'Edit Workflow' : 'Create New Workflow'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <WorkflowDesigner
                workflow={currentWorkflow as Workflow}
                onSave={handleSave}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Template Selection */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Select Workflow Template
              </h3>
              <button
                onClick={handleCloseTemplateModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <WorkflowTemplateSelector
                templates={templates}
                onSelect={handleCreateFromTemplate}
                onCancel={handleCloseTemplateModal}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Execution History */}
      {isExecutionHistoryOpen && selectedWorkflowId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Workflow Execution History
              </h3>
              <button
                onClick={handleCloseExecutionHistory}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <WorkflowExecutionHistory
                workflowId={selectedWorkflowId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomationSettings;
