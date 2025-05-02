import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getWorkflowTemplates, 
  createWorkflowFromTemplate 
} from '../../services/workflowAutomationService';
import { Workflow, ModuleType } from '../../types/workflowAutomation';
import { Button } from '../ui/Button';
import { 
  DocumentDuplicateIcon, 
  ArrowPathIcon, 
  TagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface WorkflowTemplateGalleryProps {
  onClose: () => void;
  onTemplateSelected?: (workflowId: string) => void;
}

export const WorkflowTemplateGallery: React.FC<WorkflowTemplateGalleryProps> = ({
  onClose,
  onTemplateSelected
}) => {
  const [templates, setTemplates] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<ModuleType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Workflow | null>(null);
  const [customName, setCustomName] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const templatesData = await getWorkflowTemplates();
      setTemplates(templatesData);
    } catch (error: any) {
      setError(error.message || 'Failed to load workflow templates');
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    setCreating(true);
    try {
      const name = customName.trim() || `${selectedTemplate.name} Copy`;
      const newWorkflow = await createWorkflowFromTemplate(selectedTemplate.id, name);
      
      if (onTemplateSelected) {
        onTemplateSelected(newWorkflow.id);
      } else {
        navigate(`/settings/workflow-automation/edit/${newWorkflow.id}`);
      }
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create workflow from template');
      console.error('Error creating from template:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesModule = selectedModuleFilter === 'all' || template.module === selectedModuleFilter;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesModule && matchesSearch;
  });

  const moduleOptions: { value: ModuleType | 'all', label: string }[] = [
    { value: 'all', label: 'All Modules' },
    { value: 'tickets', label: 'Tickets' },
    { value: 'problems', label: 'Problems' },
    { value: 'changes', label: 'Changes' },
    { value: 'improvements', label: 'Improvements' },
    { value: 'knowledge', label: 'Knowledge Base' },
    { value: 'service_catalog', label: 'Service Catalog' },
    { value: 'users', label: 'Users' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'external', label: 'External Integrations' }
  ];

  const getModuleColor = (moduleType: ModuleType) => {
    switch (moduleType) {
      case 'tickets':
        return 'bg-blue-100 text-blue-800';
      case 'problems':
        return 'bg-red-100 text-red-800';
      case 'changes':
        return 'bg-purple-100 text-purple-800';
      case 'improvements':
        return 'bg-green-100 text-green-800';
      case 'knowledge':
        return 'bg-yellow-100 text-yellow-800';
      case 'service_catalog':
        return 'bg-indigo-100 text-indigo-800';
      case 'users':
        return 'bg-pink-100 text-pink-800';
      case 'notifications':
        return 'bg-orange-100 text-orange-800';
      case 'external':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Workflow Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedTemplate ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900">{selectedTemplate.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getModuleColor(selectedTemplate.module)}`}>
                  {moduleOptions.find(m => m.value === selectedTemplate.module)?.label}
                </span>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Back</span>
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            
            {selectedTemplate.description && (
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-700">{selectedTemplate.description}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-1">
                New Workflow Name
              </label>
              <input
                type="text"
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`${selectedTemplate.name} Copy`}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Template Details</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nodes</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedTemplate.nodes.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Connections</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedTemplate.connections.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Variables</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedTemplate.variables.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedTemplate.created_by}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={() => setSelectedTemplate(null)}
                variant="outline"
                className="mr-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFromTemplate}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="-ml-1 mr-2 h-4 w-4" />
                    Create from Template
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <label htmlFor="search" className="sr-only">Search templates</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Search templates"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <label htmlFor="module-filter" className="sr-only">Filter by module</label>
                  <select
                    id="module-filter"
                    name="module-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={selectedModuleFilter}
                    onChange={(e) => setSelectedModuleFilter(e.target.value as ModuleType | 'all')}
                  >
                    {moduleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <ArrowPathIcon className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || selectedModuleFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No workflow templates are available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTemplates.map(template => (
                    <div 
                      key={template.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getModuleColor(template.module)}`}>
                              {moduleOptions.find(m => m.value === template.module)?.label}
                            </span>
                          </div>
                          <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        {template.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{template.description}</p>
                        )}
                        
                        <div className="mt-4 flex items-center text-xs text-gray-500">
                          <span className="mr-3">{template.nodes.length} nodes</span>
                          <span>{template.connections.length} connections</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplateGallery;
