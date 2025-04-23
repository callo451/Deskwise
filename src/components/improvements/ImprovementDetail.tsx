import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Tab } from '@headlessui/react';
import { 
  DocumentTextIcon,
  ClockIcon,
  LinkIcon,
  ChartBarIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  getImprovementById, 
  updateImprovementStatus 
} from '../../services/improvementService';
import { Improvement, ImprovementStatus } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import ImprovementForm from './ImprovementForm';
// Import the history and links components
// These will be imported from the actual files we've created
import ImprovementHistory from '../improvements/ImprovementHistory';
import ImprovementLinks from '../improvements/ImprovementLinks';

const ImprovementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userDetails } = useAuth();
  
  const [improvement, setImprovement] = useState<Improvement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user can edit the improvement
  const canEdit = userDetails?.role === 'admin' || 
                 userDetails?.role === 'manager' || 
                 (userDetails?.role === 'technician' && 
                  improvement?.assigned_to === userDetails?.id);

  useEffect(() => {
    if (!id) {
      setError('Improvement ID is required');
      setLoading(false);
      return;
    }
    
    fetchImprovement();
  }, [id]);
  
  const fetchImprovement = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) return;
      
      const improvementData = await getImprovementById(id);
      setImprovement(improvementData);
    } catch (err) {
      console.error('Error fetching improvement:', err);
      setError('Failed to load improvement details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateImprovement = async (updatedImprovement: Improvement) => {
    setImprovement(updatedImprovement);
    setIsEditing(false);
  };
  
  const handleStatusChange = async (newStatus: ImprovementStatus) => {
    if (!improvement || !id) return;
    
    try {
      setIsSaving(true);
      
      const updatedImprovement = await updateImprovementStatus(id, newStatus);
      setImprovement(updatedImprovement);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTabChange = (index: number) => {
    const tabs = ['overview', 'metrics', 'links', 'history'];
    setActiveTab(tabs[index]);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  if (!improvement) {
    return <ErrorDisplay message="Improvement not found" />;
  }
  
  if (isEditing) {
    return (
      <div className="max-w-6xl mx-auto">
        <ImprovementForm
          improvement={improvement}
          onSuccess={handleUpdateImprovement}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  const getStatusBadgeClass = (status: ImprovementStatus) => {
    switch (status) {
      case 'proposed':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'process':
        return 'bg-blue-100 text-blue-800';
      case 'service':
        return 'bg-green-100 text-green-800';
      case 'technology':
        return 'bg-purple-100 text-purple-800';
      case 'people':
        return 'bg-orange-100 text-orange-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{improvement.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(improvement.status)}`}>
                  {improvement.status.replace('_', ' ').charAt(0).toUpperCase() + improvement.status.replace('_', ' ').slice(1)}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(improvement.priority)}`}>
                  {improvement.priority.charAt(0).toUpperCase() + improvement.priority.slice(1)} Priority
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeClass(improvement.category)}`}>
                  {improvement.category.charAt(0).toUpperCase() + improvement.category.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchImprovement}
                className="flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(improvement.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              <p className="text-sm text-gray-500">
                by {(improvement as any).created_by_user?.first_name} {(improvement as any).created_by_user?.last_name}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
              <p className="mt-1 text-sm text-gray-900">
                {(improvement as any).assigned_to_user ? (
                  <>
                    {(improvement as any).assigned_to_user.first_name} {(improvement as any).assigned_to_user.last_name}
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service</h3>
              <p className="mt-1 text-sm text-gray-900">
                {(improvement as any).service?.name || <span className="text-gray-400">Not specified</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Tab.Group onChange={handleTabChange}>
          <Tab.List className="flex border-b border-gray-200">
            <Tab className={({ selected }) => 
              `flex-1 py-4 px-4 text-center text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              <div className="flex justify-center items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Overview
              </div>
            </Tab>
            <Tab className={({ selected }) => 
              `flex-1 py-4 px-4 text-center text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              <div className="flex justify-center items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Metrics
              </div>
            </Tab>
            <Tab className={({ selected }) => 
              `flex-1 py-4 px-4 text-center text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              <div className="flex justify-center items-center">
                <LinkIcon className="h-5 w-5 mr-2" />
                Links
              </div>
            </Tab>
            <Tab className={({ selected }) => 
              `flex-1 py-4 px-4 text-center text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              <div className="flex justify-center items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                History
              </div>
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Overview Panel */}
            <Tab.Panel className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{improvement.description}</p>
                  </div>
                  
                  {improvement.benefits && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Benefits</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{improvement.benefits}</p>
                      </div>
                    </div>
                  )}
                  
                  {improvement.success_criteria && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Success Criteria</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{improvement.success_criteria}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Implementation Details</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <dl className="grid grid-cols-1 gap-y-4">
                      {improvement.process_affected && (
                        <>
                          <dt className="text-sm font-medium text-gray-500">Process Affected</dt>
                          <dd className="text-sm text-gray-900">{improvement.process_affected}</dd>
                        </>
                      )}
                      
                      {improvement.resources_required && (
                        <>
                          <dt className="text-sm font-medium text-gray-500">Resources Required</dt>
                          <dd className="text-sm text-gray-900 whitespace-pre-wrap">{improvement.resources_required}</dd>
                        </>
                      )}
                      
                      {improvement.estimated_effort && (
                        <>
                          <dt className="text-sm font-medium text-gray-500">Estimated Effort</dt>
                          <dd className="text-sm text-gray-900">{improvement.estimated_effort}</dd>
                        </>
                      )}
                      
                      {improvement.estimated_cost !== null && (
                        <>
                          <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                          <dd className="text-sm text-gray-900">${improvement.estimated_cost.toFixed(2)}</dd>
                        </>
                      )}
                      
                      {improvement.expected_roi && (
                        <>
                          <dt className="text-sm font-medium text-gray-500">Expected ROI</dt>
                          <dd className="text-sm text-gray-900">{improvement.expected_roi}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                  
                  {improvement.implementation_notes && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Implementation Notes</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{improvement.implementation_notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {canEdit && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        {improvement.status === 'proposed' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className={getButtonColorClass('success')}
                              onClick={() => handleStatusChange('approved')}
                              disabled={isSaving}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className={getButtonColorClass('danger')}
                              onClick={() => handleStatusChange('rejected')}
                              disabled={isSaving}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {improvement.status === 'approved' && (
                          <Button
                            variant="default"
                            size="sm"
                            className={getButtonColorClass('warning')}
                            onClick={() => handleStatusChange('in_progress')}
                            disabled={isSaving}
                          >
                            Start Implementation
                          </Button>
                        )}
                        
                        {improvement.status === 'in_progress' && (
                          <Button
                            variant="default"
                            size="sm"
                            className={getButtonColorClass('success')}
                            onClick={() => handleStatusChange('implemented')}
                            disabled={isSaving}
                          >
                            Mark as Implemented
                          </Button>
                        )}
                        
                        {improvement.status === 'implemented' && (
                          <Button
                            variant="default"
                            size="sm"
                            className={getButtonColorClass('primary')}
                            onClick={() => handleStatusChange('closed')}
                            disabled={isSaving}
                          >
                            Close Improvement
                          </Button>
                        )}
                        
                        {isSaving && (
                          <span className="ml-2 inline-flex items-center text-sm text-gray-500">
                            <LoadingSpinner size="sm" className="mr-1" /> Updating...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
            
            {/* Metrics Panel */}
            <Tab.Panel className="p-6">
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Metrics & Measurements</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This section will display metrics and KPIs related to this improvement.
                </p>
                {canEdit && (
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Metrics tracking will be implemented in a future update')}
                    >
                      Add Metrics
                    </Button>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Links Panel */}
            <Tab.Panel className="p-6">
              <ImprovementLinks 
                improvement={improvement}
                onRefresh={fetchImprovement}
              />
            </Tab.Panel>
            
            {/* History Panel */}
            <Tab.Panel className="p-6">
              <ImprovementHistory 
                improvement={improvement}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ImprovementDetail;
