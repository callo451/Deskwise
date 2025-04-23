import React from 'react';
import { Problem, ProblemStatus, ProblemPriority, ProblemImpact, ProblemUrgency } from '../../types/database';
import { Button } from '../ui/Button';

interface ProblemDetailFormProps {
  problem: Problem;
  editedProblem: {
    title: string;
    description: string;
    status: ProblemStatus;
    priority: ProblemPriority;
    impact: ProblemImpact;
    urgency: ProblemUrgency;
    symptoms: string;
    root_cause: string | null;
    workaround: string | null;
    permanent_solution: string | null;
    category_id: string | null;
    service_id: string | null;
    assigned_to: string | null;
    known_error_db_entry: boolean;
  };
  users: any[];
  services: any[];
  categories: any[];
  onEditChange: (field: string, value: any) => void;
}

const ProblemDetailForm: React.FC<ProblemDetailFormProps> = ({
  problem,
  editedProblem,
  users,
  services,
  categories,
  onEditChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={editedProblem.title}
          onChange={(e) => onEditChange('title', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={editedProblem.description}
          onChange={(e) => onEditChange('description', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={editedProblem.status}
            onChange={(e) => onEditChange('status', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="identified">Identified</option>
            <option value="investigating">Investigating</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="known_error">Known Error</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={editedProblem.priority}
            onChange={(e) => onEditChange('priority', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
            Impact
          </label>
          <select
            id="impact"
            value={editedProblem.impact}
            onChange={(e) => onEditChange('impact', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency
          </label>
          <select
            id="urgency"
            value={editedProblem.urgency}
            onChange={(e) => onEditChange('urgency', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category_id"
            value={editedProblem.category_id || ''}
            onChange={(e) => onEditChange('category_id', e.target.value || null)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <select
            id="service_id"
            value={editedProblem.service_id || ''}
            onChange={(e) => onEditChange('service_id', e.target.value || null)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To
        </label>
        <select
          id="assigned_to"
          value={editedProblem.assigned_to || ''}
          onChange={(e) => onEditChange('assigned_to', e.target.value || null)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
          Symptoms
        </label>
        <textarea
          id="symptoms"
          rows={3}
          value={editedProblem.symptoms || ''}
          onChange={(e) => onEditChange('symptoms', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Describe the symptoms of the problem"
        />
      </div>

      <div>
        <label htmlFor="root_cause" className="block text-sm font-medium text-gray-700 mb-1">
          Root Cause
        </label>
        <textarea
          id="root_cause"
          rows={3}
          value={editedProblem.root_cause || ''}
          onChange={(e) => onEditChange('root_cause', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Describe the root cause of the problem if known"
        />
      </div>

      <div className="flex items-center">
        <input
          id="known_error_db_entry"
          type="checkbox"
          checked={editedProblem.known_error_db_entry}
          onChange={(e) => onEditChange('known_error_db_entry', e.target.checked)}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="known_error_db_entry" className="ml-2 block text-sm text-gray-700">
          Add to Known Error Database
        </label>
      </div>
    </div>
  );
};

export default ProblemDetailForm;
