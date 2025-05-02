import React, { useState, useEffect } from 'react';
import { Change, ChangeStatus } from '../../types/database';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import { format } from 'date-fns';
import { fetchUsers } from '../../services/userService';
import { getTicketCategories } from '../../services/settingsService';
// Import services
import { getServices } from '../../services/serviceService';
import { useAuth } from '../../contexts/AuthContext';

interface ChangeDetailOverviewProps {
  change: Change;
  isEditing: boolean;
  onChangeUpdate: (updatedChange: Partial<Change>) => void;
  onStatusChange: (newStatus: ChangeStatus) => void;
  canEdit: boolean;
}

const ChangeDetailOverview: React.FC<ChangeDetailOverviewProps> = ({
  change,
  isEditing,
  onChangeUpdate,
  onStatusChange,
  canEdit
}) => {
  const { userDetails } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  // Find user, category, and service details
  const assignedUser = users.find(user => user.id === change.assigned_to);
  const requestedByUser = users.find(user => user.id === change.requested_by);
  const category = categories.find(cat => cat.id === change.category_id);
  const service = services.find(svc => svc.id === change.service_id);
  
  useEffect(() => {
    fetchReferenceData();
  }, []);
  
  const fetchReferenceData = async () => {
    try {
      if (userDetails?.tenant_id) {
        const [usersData, categoriesData, servicesData] = await Promise.all([
          fetchUsers(userDetails.tenant_id),
          getTicketCategories(),
          getServices()
        ]);
        
        setUsers(usersData);
        setCategories(categoriesData);
        setServices(servicesData);
      }
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'assessment':
        return 'bg-indigo-100 text-indigo-800';
      case 'approval':
        return 'bg-purple-100 text-purple-800';
      case 'scheduled':
        return 'bg-cyan-100 text-cyan-800';
      case 'implementation':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get risk level badge color
  const getRiskLevelBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'very_high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get impact badge color
  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'individual':
        return 'bg-green-100 text-green-800';
      case 'department':
        return 'bg-yellow-100 text-yellow-800';
      case 'multiple_departments':
        return 'bg-orange-100 text-orange-800';
      case 'organization_wide':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    onChangeUpdate({ [field]: value });
  };
  
  // Status transition buttons based on current status
  const renderStatusTransitionButtons = () => {
    if (!canEdit) return null;
    
    const buttons = [];
    
    switch (change.status) {
      case 'draft':
        buttons.push(
          <Button
            variant="default" 
            size="sm" 
            onClick={() => onStatusChange('submitted')}
            className={getButtonColorClass('primary')}
          >
            Submit for Assessment
          </Button>
        );
        buttons.push(
          <Button
            variant="outline" 
            size="sm" 
            onClick={() => onStatusChange('cancelled')}
            className={`${getButtonColorClass('danger')}`}
          >
            Cancel Change
          </Button>
        );
        break;
        
      case 'submitted':
        // Buttons moved to the top of the page in ChangeDetailPage.tsx
        break;
        
      case 'assessment':
        if (['admin', 'manager'].includes(userDetails?.role || '')) {
          buttons.push(
            <Button
              variant="default" 
              size="sm" 
              onClick={() => onStatusChange('approval')}
              className={getButtonColorClass('primary')}
            >
              Send for Approval
            </Button>
          );
          buttons.push(
            <Button
              key="reject2" 
              variant="destructive" 
              size="sm" 
              onClick={() => onStatusChange('rejected')}
            >
              Reject Change
            </Button>
          );
        }
        break;
        
      // Additional status transitions would be added here
        
      default:
        break;
    }
    
    return buttons.length > 0 ? (
      <div className="mt-6 flex space-x-3">
        {buttons}
      </div>
    ) : null;
  };
  
  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Details</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={change.title}
                  onChange={(e) => handleChange('title', e.target.value)}
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
                  value={change.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
                  Justification
                </label>
                <textarea
                  id="justification"
                  rows={3}
                  value={change.justification}
                  onChange={(e) => handleChange('justification', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Title</h4>
                <p className="mt-1">{change.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 whitespace-pre-wrap">{change.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Justification</h4>
                <p className="mt-1 whitespace-pre-wrap">{change.justification}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Classification */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Classification</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="change_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Change Type
                </label>
                <select
                  id="change_type"
                  value={change.change_type}
                  onChange={(e) => handleChange('change_type', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="normal">Normal</option>
                  <option value="emergency">Emergency</option>
                  <option value="pre-approved">Pre-approved</option>
                </select>
              </div>
              <div>
                <label htmlFor="risk_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  id="risk_level"
                  value={change.risk_level}
                  onChange={(e) => handleChange('risk_level', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
              <div>
                <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
                  Impact
                </label>
                <select
                  id="impact"
                  value={change.impact}
                  onChange={(e) => handleChange('impact', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="individual">Individual</option>
                  <option value="department">Department</option>
                  <option value="multiple_departments">Multiple Departments</option>
                  <option value="organization_wide">Organization Wide</option>
                </select>
              </div>
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category_id"
                  value={change.category_id || ''}
                  onChange={(e) => handleChange('category_id', e.target.value || null)}
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
                  value={change.service_id || ''}
                  onChange={(e) => handleChange('service_id', e.target.value || null)}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="mt-1">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getStatusBadgeColor(change.status).split(' ')[0],
                      color: getStatusBadgeColor(change.status).split(' ')[1]
                    }}
                  >
                    {change.status.charAt(0).toUpperCase() + change.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Change Type</h4>
                <p className="mt-1 capitalize">{change.change_type.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Risk Level</h4>
                <div className="mt-1">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getRiskLevelBadgeColor(change.risk_level).split(' ')[0],
                      color: getRiskLevelBadgeColor(change.risk_level).split(' ')[1]
                    }}
                  >
                    {change.risk_level.charAt(0).toUpperCase() + change.risk_level.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Impact</h4>
                <div className="mt-1">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getImpactBadgeColor(change.impact).split(' ')[0],
                      color: getImpactBadgeColor(change.impact).split(' ')[1]
                    }}
                  >
                    {change.impact.charAt(0).toUpperCase() + change.impact.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <p className="mt-1">{category?.name || 'None'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Service</h4>
                <p className="mt-1">{service?.name || 'None'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Assignment */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Assignment</h3>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  value={change.assigned_to || ''}
                  onChange={(e) => handleChange('assigned_to', e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.filter(user => ['technician', 'manager', 'admin'].includes(user.role)).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="requested_by" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested By
                </label>
                <select
                  id="requested_by"
                  value={change.requested_by || ''}
                  onChange={(e) => handleChange('requested_by', e.target.value || null)}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                <p className="mt-1">
                  {assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1">
                  {requestedByUser ? `${requestedByUser.first_name} ${requestedByUser.last_name}` : 'Self'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                <p className="mt-1">{formatDate(change.created_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Updated At</h4>
                <p className="mt-1">{formatDate(change.updated_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Transition Buttons */}
      {!isEditing && renderStatusTransitionButtons()}
    </div>
  );
};

export default ChangeDetailOverview;
