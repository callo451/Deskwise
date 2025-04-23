import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChange } from '../../services/changeService';
import { getTicketCategories } from '../../services/settingsService';
import { getServices } from '../../services/serviceService';
import { fetchUsers } from '../../services/userService';
import { ChangeType, ChangeRiskLevel, ChangeImpact } from '../../types/database';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ChangeFormProps {
  onCancel: () => void;
  onChangeCreated?: (changeId: string) => void;
  ticketId?: string; // Optional ticket ID if converting from a ticket
  problemId?: string; // Optional problem ID if creating from a problem
}

const ChangeForm: React.FC<ChangeFormProps> = ({ onCancel, onChangeCreated, ticketId, problemId }) => {
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
    change_type: 'normal' as ChangeType,
    risk_level: 'medium' as ChangeRiskLevel,
    impact: 'department' as ChangeImpact,
    justification: '',
    implementation_plan: '',
    test_plan: '',
    backout_plan: '',
    category_id: '',
    service_id: '',
    assigned_to: '',
    requested_by: '',
    planned_start_date: '',
    planned_end_date: '',
    affected_services: [] as string[],
    affected_configuration_items: [] as string[]
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
        // Filter to only show active users that can be assigned changes (technicians, managers, admins)
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
      // Validate dates if provided
      if (formData.planned_start_date && formData.planned_end_date) {
        const startDate = new Date(formData.planned_start_date);
        const endDate = new Date(formData.planned_end_date);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      
      // Prepare data for API
      const changeData = {
        title: formData.title,
        description: formData.description,
        change_type: formData.change_type,
        risk_level: formData.risk_level,
        impact: formData.impact,
        justification: formData.justification,
        implementation_plan: formData.implementation_plan || undefined,
        test_plan: formData.test_plan || undefined,
        backout_plan: formData.backout_plan || undefined,
        category_id: formData.category_id || undefined,
        service_id: formData.service_id || undefined,
        assigned_to: formData.assigned_to || undefined,
        requested_by: formData.requested_by || undefined,
        planned_start_date: formData.planned_start_date || undefined,
        planned_end_date: formData.planned_end_date || undefined,
        affected_services: formData.affected_services.length > 0 ? formData.affected_services : undefined,
        affected_configuration_items: formData.affected_configuration_items.length > 0 ? formData.affected_configuration_items : undefined
      };
      
      const newChange = await createChange(changeData);
      
      // If we have a ticket ID, link it to the change
      if (ticketId) {
        // Note: We'll handle this in the parent component
      }
      
      // If we have a problem ID, link it to the change
      if (problemId) {
        // Note: We'll handle this in the parent component
      }
      
      // Call the onChangeCreated callback or navigate to the new change
      if (onChangeCreated) {
        onChangeCreated(newChange.id);
      } else {
        navigate(`/changes/${newChange.id}`);
      }
    } catch (err: any) {
      console.error('Error creating change:', err);
      setError(err.message || 'Failed to create change');
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
            {ticketId ? 'Create Change from Ticket' : problemId ? 'Create Change from Problem' : 'Create New Change'}
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

        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
            Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            id="justification"
            rows={3}
            value={formData.justification}
            onChange={(e) => handleChange('justification', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Explain why this change is necessary"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="change_type" className="block text-sm font-medium text-gray-700 mb-1">
              Change Type <span className="text-red-500">*</span>
            </label>
            <select
              id="change_type"
              value={formData.change_type}
              onChange={(e) => handleChange('change_type', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="standard">Standard</option>
              <option value="normal">Normal</option>
              <option value="emergency">Emergency</option>
              <option value="pre-approved">Pre-approved</option>
            </select>
          </div>

          <div>
            <label htmlFor="risk_level" className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level <span className="text-red-500">*</span>
            </label>
            <select
              id="risk_level"
              value={formData.risk_level}
              onChange={(e) => handleChange('risk_level', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
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
              <option value="individual">Individual</option>
              <option value="department">Department</option>
              <option value="multiple_departments">Multiple Departments</option>
              <option value="organization_wide">Organization Wide</option>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="requested_by" className="block text-sm font-medium text-gray-700 mb-1">
              Requested By
            </label>
            <select
              id="requested_by"
              value={formData.requested_by}
              onChange={(e) => handleChange('requested_by', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Self</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="planned_start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Planned Start Date
            </label>
            <input
              id="planned_start_date"
              type="datetime-local"
              value={formData.planned_start_date}
              onChange={(e) => handleChange('planned_start_date', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="planned_end_date" className="block text-sm font-medium text-gray-700 mb-1">
              Planned End Date
            </label>
            <input
              id="planned_end_date"
              type="datetime-local"
              value={formData.planned_end_date}
              onChange={(e) => handleChange('planned_end_date', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="implementation_plan" className="block text-sm font-medium text-gray-700 mb-1">
            Implementation Plan
          </label>
          <textarea
            id="implementation_plan"
            rows={4}
            value={formData.implementation_plan}
            onChange={(e) => handleChange('implementation_plan', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe how the change will be implemented"
          />
        </div>

        <div>
          <label htmlFor="test_plan" className="block text-sm font-medium text-gray-700 mb-1">
            Test Plan
          </label>
          <textarea
            id="test_plan"
            rows={3}
            value={formData.test_plan}
            onChange={(e) => handleChange('test_plan', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe how the change will be tested"
          />
        </div>

        <div>
          <label htmlFor="backout_plan" className="block text-sm font-medium text-gray-700 mb-1">
            Backout Plan
          </label>
          <textarea
            id="backout_plan"
            rows={3}
            value={formData.backout_plan}
            onChange={(e) => handleChange('backout_plan', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe how to revert the change if needed"
          />
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
            variant="default"
            disabled={isSubmitting}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              'Create Change'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangeForm;
