import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createImprovement, 
  updateImprovement, 
  CreateImprovementData,
  UpdateImprovementData 
} from '../../services/improvementService';
import { getServices } from '../../services/serviceService';
import { getUsers } from '../../services/userService';
import { 
  Improvement, 
  ImprovementStatus, 
  ImprovementPriority, 
  ImprovementCategory,
  Service,
  User
} from '../../types/database';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import ErrorDisplay from '../ui/ErrorDisplay';

interface ImprovementFormProps {
  improvement?: Improvement;
  onSuccess?: (improvement: Improvement) => void;
  onCancel?: () => void;
}

const ImprovementForm: React.FC<ImprovementFormProps> = ({ 
  improvement, 
  onSuccess, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const isEditing = !!improvement;
  
  // Form state
  const [title, setTitle] = useState(improvement?.title || '');
  const [description, setDescription] = useState(improvement?.description || '');
  const [status, setStatus] = useState<ImprovementStatus>(improvement?.status || 'proposed');
  const [priority, setPriority] = useState<ImprovementPriority>(improvement?.priority || 'medium');
  const [category, setCategory] = useState<ImprovementCategory>(improvement?.category || 'process');
  const [benefits, setBenefits] = useState(improvement?.benefits || '');
  const [resourcesRequired, setResourcesRequired] = useState(improvement?.resources_required || '');
  const [estimatedEffort, setEstimatedEffort] = useState(improvement?.estimated_effort || '');
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>(improvement?.estimated_cost);
  const [expectedRoi, setExpectedRoi] = useState(improvement?.expected_roi || '');
  const [serviceId, setServiceId] = useState<string | null>(improvement?.service_id || null);
  const [processAffected, setProcessAffected] = useState(improvement?.process_affected || '');
  const [successCriteria, setSuccessCriteria] = useState(improvement?.success_criteria || '');
  const [implementationNotes, setImplementationNotes] = useState(improvement?.implementation_notes || '');
  const [assignedTo, setAssignedTo] = useState<string | null>(improvement?.assigned_to || null);
  const [requestedBy, setRequestedBy] = useState<string | null>(improvement?.requested_by || null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Status options
  const statusOptions: { value: ImprovementStatus; label: string }[] = [
    { value: 'proposed', label: 'Proposed' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'implemented', label: 'Implemented' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Priority options
  const priorityOptions: { value: ImprovementPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Category options
  const categoryOptions: { value: ImprovementCategory; label: string }[] = [
    { value: 'process', label: 'Process' },
    { value: 'service', label: 'Service' },
    { value: 'technology', label: 'Technology' },
    { value: 'people', label: 'People' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesData = await getServices();
        setServices(servicesData);
        
        // Fetch users
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }
      
      if (!description.trim()) {
        setError('Description is required');
        setLoading(false);
        return;
      }
      
      if (isEditing && improvement) {
        // Update existing improvement
        const updateData: UpdateImprovementData = {
          title,
          description,
          status,
          priority,
          category,
          benefits: benefits || null,
          resources_required: resourcesRequired || null,
          estimated_effort: estimatedEffort || null,
          estimated_cost: estimatedCost,
          expected_roi: expectedRoi || null,
          service_id: serviceId,
          process_affected: processAffected || null,
          success_criteria: successCriteria || null,
          implementation_notes: implementationNotes || null,
          assigned_to: assignedTo,
          requested_by: requestedBy
        };
        
        const updatedImprovement = await updateImprovement(improvement.id, updateData);
        
        if (onSuccess) {
          onSuccess(updatedImprovement);
        } else {
          navigate(`/improvements/${updatedImprovement.id}`);
        }
      } else {
        // Create new improvement
        const createData: CreateImprovementData = {
          title,
          description,
          priority,
          category,
          benefits: benefits || undefined,
          resources_required: resourcesRequired || undefined,
          estimated_effort: estimatedEffort || undefined,
          estimated_cost: estimatedCost,
          expected_roi: expectedRoi || undefined,
          service_id: serviceId || undefined,
          process_affected: processAffected || undefined,
          success_criteria: successCriteria || undefined,
          assigned_to: assignedTo || undefined,
          requested_by: requestedBy || undefined
        };
        
        const newImprovement = await createImprovement(createData);
        
        if (onSuccess) {
          onSuccess(newImprovement);
        } else {
          navigate(`/improvements/${newImprovement.id}`);
        }
      }
    } catch (err) {
      console.error('Error saving improvement:', err);
      setError('Failed to save improvement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorDisplay message={error} />}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'Edit Improvement' : 'Create New Improvement'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {isEditing && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ImprovementStatus)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ImprovementPriority)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ImprovementCategory)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                id="service"
                value={serviceId || ''}
                onChange={(e) => setServiceId(e.target.value || null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">-- Select Service --</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="processAffected" className="block text-sm font-medium text-gray-700 mb-1">
                Process Affected
              </label>
              <input
                type="text"
                id="processAffected"
                value={processAffected}
                onChange={(e) => setProcessAffected(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">
                Benefits
              </label>
              <textarea
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="resourcesRequired" className="block text-sm font-medium text-gray-700 mb-1">
                Resources Required
              </label>
              <textarea
                id="resourcesRequired"
                value={resourcesRequired}
                onChange={(e) => setResourcesRequired(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="successCriteria" className="block text-sm font-medium text-gray-700 mb-1">
                Success Criteria
              </label>
              <textarea
                id="successCriteria"
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="estimatedEffort" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Effort
              </label>
              <input
                type="text"
                id="estimatedEffort"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 40 person-hours"
              />
            </div>
            
            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="estimatedCost"
                  value={estimatedCost || ''}
                  onChange={(e) => setEstimatedCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="expectedRoi" className="block text-sm font-medium text-gray-700 mb-1">
                Expected ROI
              </label>
              <input
                type="text"
                id="expectedRoi"
                value={expectedRoi}
                onChange={(e) => setExpectedRoi(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 200% over 12 months"
              />
            </div>
            
            {isEditing && (
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="implementationNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Implementation Notes
                </label>
                <textarea
                  id="implementationNotes"
                  value={implementationNotes}
                  onChange={(e) => setImplementationNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="assignedTo"
                value={assignedTo || ''}
                onChange={(e) => setAssignedTo(e.target.value || null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">-- Unassigned --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Requested By
              </label>
              <select
                id="requestedBy"
                value={requestedBy || ''}
                onChange={(e) => setRequestedBy(e.target.value || null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => navigate('/improvements'))}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            className={getButtonColorClass('primary')}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Save Changes' : 'Create Improvement'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ImprovementForm;
