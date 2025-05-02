import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  module: string;
  thumbnail?: string;
}

interface WorkflowTemplateSelectorProps {
  templates: WorkflowTemplate[];
  onSelect: (templateId: string, name: string) => void;
  onCancel: () => void;
}

export const WorkflowTemplateSelector: React.FC<WorkflowTemplateSelectorProps> = ({
  templates,
  onSelect,
  onCancel
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || template.module === moduleFilter;
    
    return matchesSearch && matchesModule;
  });
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // Set default workflow name based on template
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setWorkflowName(template.name);
    }
  };
  
  const handleCreate = () => {
    if (!selectedTemplateId || !workflowName.trim()) return;
    onSelect(selectedTemplateId, workflowName.trim());
  };
  
  const getModuleLabel = (module: string): string => {
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
        
        <div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
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
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No templates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedTemplateId === template.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-4xl">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getModuleLabel(template.module)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedTemplateId && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Workflow Name</h4>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Enter workflow name"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <Button
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedTemplateId || !workflowName.trim()}
        >
          Create Workflow
        </Button>
      </div>
    </div>
  );
};

export default WorkflowTemplateSelector;
