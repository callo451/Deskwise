import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProblem } from '../../services/problemService';
import { getTicketCategories } from '../../services/settingsService';
import { getServices } from '../../services/serviceService';
import { fetchUsers } from '../../services/userService';
import { ProblemStatus, ProblemPriority, ProblemImpact, ProblemUrgency } from '../../types/database';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ProblemFormProps {
  onCancel: () => void;
  ticketId?: string; // Optional ticket ID if converting from a ticket
}

const ProblemForm: React.FC<ProblemFormProps> = ({ onCancel, ticketId }) => {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'identified' as ProblemStatus,
    priority: 'medium' as ProblemPriority,
    impact: 'medium' as ProblemImpact,
    urgency: 'medium' as ProblemUrgency,
    symptoms: '',
    root_cause: '',
    workaround: '',
    permanent_solution: '',
    category_id: '',
    service_id: '',
    assigned_to: '',
    known_error_db_entry: false,
    related_incidents: ticketId ? [ticketId] : [] as string[]
  });

  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const [categoriesData, servicesData] = await Promise.all([
        getTicketCategories(),
        getServices()
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      
      // Fetch users for assignment dropdown
      if (userDetails?.tenant_id) {
        const usersData = await fetchUsers(userDetails.tenant_id);
        // Filter to only show active users that can be assigned problems (technicians, managers, admins)
        const assignableUsers = usersData.filter(user => 
          user.is_active && ['technician', 'manager', 'admin'].includes(user.role)
        );
        setUsers(assignableUsers);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for API
      const problemData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        impact: formData.impact,
        urgency: formData.urgency,
        symptoms: formData.symptoms || undefined,
        root_cause: formData.root_cause || undefined,
        workaround: formData.workaround || undefined,
        permanent_solution: formData.permanent_solution || undefined,
        category_id: formData.category_id || undefined,
        service_id: formData.service_id || undefined,
        assigned_to: formData.assigned_to || undefined,
        known_error_db_entry: formData.known_error_db_entry,
        related_incidents: formData.related_incidents.length > 0 ? formData.related_incidents : undefined
      };
      
      const newProblem = await createProblem(problemData);
      
      // Navigate to the new problem
      navigate(`/problems/${newProblem.id}`);
    } catch (err: any) {
      console.error('Error creating problem:', err);
      setError(err.message || 'Failed to create problem');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            {ticketId ? 'Convert Ticket to Problem' : 'Create New Problem'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
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
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
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
              Impact <span className="text-red-500">*</span>
            </label>
            <select
              id="impact"
              value={formData.impact}
              onChange={(e) => handleChange('impact', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency <span className="text-red-500">*</span>
            </label>
            <select
              id="urgency"
              value={formData.urgency}
              onChange={(e) => handleChange('urgency', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
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
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
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
              value={formData.service_id}
              onChange={(e) => handleChange('service_id', e.target.value)}
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
            value={formData.assigned_to}
            onChange={(e) => handleChange('assigned_to', e.target.value)}
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
            value={formData.symptoms}
            onChange={(e) => handleChange('symptoms', e.target.value)}
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
            value={formData.root_cause}
            onChange={(e) => handleChange('root_cause', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe the root cause of the problem if known"
          />
        </div>

        <div>
          <label htmlFor="workaround" className="block text-sm font-medium text-gray-700 mb-1">
            Workaround
          </label>
          <textarea
            id="workaround"
            rows={3}
            value={formData.workaround}
            onChange={(e) => handleChange('workaround', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe any temporary workarounds"
          />
        </div>

        <div className="flex items-center">
          <input
            id="known_error_db_entry"
            type="checkbox"
            checked={formData.known_error_db_entry}
            onChange={(e) => handleChange('known_error_db_entry', e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="known_error_db_entry" className="ml-2 block text-sm text-gray-700">
            Add to Known Error Database
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              'Create Problem'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProblemForm;
