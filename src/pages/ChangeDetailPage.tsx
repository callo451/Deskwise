import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getChange, 
  updateChange,
  updateChangeStatus 
} from '../services/changeService';
import { Change, ChangeStatus } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import ChangeDetailHeader from '../components/changes/ChangeDetailHeader';
import ChangeDetailTabs from '../components/changes/ChangeDetailTabs';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { Button } from '../components/ui/Button';
import { getButtonColorClass } from '../components/ui/ButtonVariants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ChangeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [change, setChange] = useState<Change | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user can edit the change
  const canEdit = userDetails?.role === 'admin' || 
                 userDetails?.role === 'manager' || 
                 (userDetails?.role === 'technician' && 
                  change?.assigned_to === userDetails?.id);

  useEffect(() => {
    if (!id) {
      setError('Change ID is required');
      setLoading(false);
      return;
    }
    
    fetchChange();
  }, [id]);
  
  const fetchChange = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) return;
      
      const changeData = await getChange(id);
      setChange(changeData);
    } catch (err: any) {
      console.error('Error fetching change:', err);
      setError(err.message || 'Failed to fetch change details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    if (!change || !id) return;
    
    try {
      setIsSaving(true);
      
      // Update the change with the current state
      await updateChange(id, change);
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating change:', err);
      setError(err.message || 'Failed to update change');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Reset any changes by re-fetching the change
    fetchChange();
    setIsEditing(false);
  };
  
  const handleBack = () => {
    navigate('/changes');
  };
  
  const handleChangeUpdate = (updatedChange: Partial<Change>) => {
    if (!change) return;
    
    setChange({
      ...change,
      ...updatedChange
    });
  };
  
  const handleStatusChange = async (newStatus: ChangeStatus) => {
    if (!change || !id) return;
    
    try {
      setIsSaving(true);
      
      // Update the status
      await updateChangeStatus(id, newStatus);
      
      // Refresh the change data
      await fetchChange();
    } catch (err: any) {
      console.error('Error updating change status:', err);
      setError(err.message || 'Failed to update change status');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !change) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorDisplay 
          message={error || 'Change not found'} 
          onRetry={fetchChange}
          onBack={() => navigate('/changes')}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Change Details | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center mr-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Changes
          </Button>
          
          {change.status === 'submitted' && (userDetails?.role === 'admin' || userDetails?.role === 'manager') && (
            <>
              <Button
                variant="default" 
                size="sm" 
                onClick={() => handleStatusChange('assessment')}
                className={`mr-2 ${getButtonColorClass('primary')}`}
              >
                Start Assessment
              </Button>
              <Button
                variant="destructive" 
                size="sm" 
                onClick={() => handleStatusChange('rejected')}
              >
                Reject Change
              </Button>
            </>
          )}
        </div>
        
        <div className="bg-white rounded-md shadow-sm">
          <ChangeDetailHeader
            change={change}
            isEditing={isEditing}
            canEdit={canEdit}
            isSaving={isSaving}
            onBack={handleBack}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          
          <ChangeDetailTabs
            change={change}
            isEditing={isEditing}
            canEdit={canEdit}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChangeUpdate={handleChangeUpdate}
            onStatusChange={handleStatusChange}
            onRefresh={fetchChange}
          />
        </div>
      </div>
    </>
  );
};

export default ChangeDetailPage;
