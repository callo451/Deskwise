import React, { useState, useEffect } from 'react';
import { Change } from '../../types/database';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import { 
  CalendarIcon, 
  ClockIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { 
  getChangeSchedule, 
  updateChangeSchedule, 
  updateChange 
} from '../../services/changeService';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface ChangeScheduleProps {
  change: Change;
  isEditing: boolean;
  canEdit: boolean;
  onChangeUpdate: (updatedChange: Partial<Change>) => void;
  onRefresh: () => void;
}

interface ScheduleData {
  id?: string;
  change_id: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

const ChangeSchedule: React.FC<ChangeScheduleProps> = ({
  change,
  isEditing,
  canEdit,
  onChangeUpdate,
  onRefresh
}) => {
  const { userDetails } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for editing schedule
  const [editSchedule, setEditSchedule] = useState<{
    planned_start_date: string;
    planned_end_date: string;
    actual_start_date: string;
    actual_end_date: string;
  }>({
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: ''
  });
  
  // Check if user can update actual dates
  // This variable is used to control editing of actual implementation dates
  const canEditActualDates = (userDetails?.role === 'admin' || userDetails?.role === 'manager' || 
                              (userDetails?.role === 'technician' && change.assigned_to === userDetails?.id)) &&
                              (change.status === 'implementation' || change.status === 'review');
  // Note: canEdit prop is passed from parent component and controls editing of planned schedule
  
  useEffect(() => {
    fetchSchedule();
  }, [change.id]);
  
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const scheduleData = await getChangeSchedule(change.id);
      
      if (scheduleData) {
        setSchedule(scheduleData);
        
        // Initialize edit form with current values
        setEditSchedule({
          planned_start_date: scheduleData.planned_start_date || '',
          planned_end_date: scheduleData.planned_end_date || '',
          actual_start_date: scheduleData.actual_start_date || '',
          actual_end_date: scheduleData.actual_end_date || ''
        });
      } else {
        // If no schedule exists, initialize with change's planned dates
        setSchedule({
          change_id: change.id,
          planned_start_date: change.planned_start_date,
          planned_end_date: change.planned_end_date,
          actual_start_date: null,
          actual_end_date: null
        });
        
        setEditSchedule({
          planned_start_date: change.planned_start_date || '',
          planned_end_date: change.planned_end_date || '',
          actual_start_date: '',
          actual_end_date: ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(err.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setEditSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveSchedule = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate dates
      if (editSchedule.planned_start_date && editSchedule.planned_end_date) {
        const startDate = new Date(editSchedule.planned_start_date);
        const endDate = new Date(editSchedule.planned_end_date);
        
        if (endDate <= startDate) {
          throw new Error('Planned end date must be after planned start date');
        }
      }
      
      if (editSchedule.actual_start_date && editSchedule.actual_end_date) {
        const startDate = new Date(editSchedule.actual_start_date);
        const endDate = new Date(editSchedule.actual_end_date);
        
        if (endDate <= startDate) {
          throw new Error('Actual end date must be after actual start date');
        }
      }
      
      // Prepare data
      const scheduleData: ScheduleData = {
        change_id: change.id,
        planned_start_date: editSchedule.planned_start_date || null,
        planned_end_date: editSchedule.planned_end_date || null,
        actual_start_date: editSchedule.actual_start_date || null,
        actual_end_date: editSchedule.actual_end_date || null
      };
      
      // Update schedule
      if (schedule?.id) {
        await updateChangeSchedule(schedule.id, scheduleData);
      } else {
        await updateChangeSchedule(change.id, scheduleData);
      }
      
      // Also update the change object with planned dates
      await updateChange(change.id, {
        planned_start_date: editSchedule.planned_start_date || null,
        planned_end_date: editSchedule.planned_end_date || null
      });
      
      // Update local state
      onChangeUpdate({
        planned_start_date: editSchedule.planned_start_date || null,
        planned_end_date: editSchedule.planned_end_date || null
      });
      
      // Refresh data
      await fetchSchedule();
      onRefresh();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStartImplementation = async () => {
    try {
      setIsSubmitting(true);
      
      const now = new Date().toISOString();
      
      // Update schedule with actual start date
      if (schedule?.id) {
        await updateChangeSchedule(schedule.id, {
          ...schedule,
          actual_start_date: now
        });
      } else {
        await updateChangeSchedule(change.id, {
          change_id: change.id,
          planned_start_date: change.planned_start_date,
          planned_end_date: change.planned_end_date,
          actual_start_date: now,
          actual_end_date: null
        });
      }
      
      // Refresh data
      await fetchSchedule();
      onRefresh();
    } catch (err: any) {
      console.error('Error starting implementation:', err);
      setError(err.message || 'Failed to start implementation');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteImplementation = async () => {
    try {
      setIsSubmitting(true);
      
      const now = new Date().toISOString();
      
      // Update schedule with actual end date
      if (schedule?.id) {
        await updateChangeSchedule(schedule.id, {
          ...schedule,
          actual_end_date: now
        });
      } else {
        await updateChangeSchedule(change.id, {
          change_id: change.id,
          planned_start_date: change.planned_start_date,
          planned_end_date: change.planned_end_date,
          actual_start_date: schedule?.actual_start_date || now,
          actual_end_date: now
        });
      }
      
      // Refresh data
      await fetchSchedule();
      onRefresh();
    } catch (err: any) {
      console.error('Error completing implementation:', err);
      setError(err.message || 'Failed to complete implementation');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not set';
    try {
      return format(parseISO(date), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format time function - used in date/time display
  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return 'Not set';
    try {
      return format(parseISO(date), 'PPP p');
    } catch (e) {
      return 'Invalid date/time';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Planned Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Planned Schedule</h3>
        </div>
        <div className="p-6">
          {isEditing && canEdit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="planned_start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Planned Start Date
                </label>
                <input
                  id="planned_start_date"
                  type="datetime-local"
                  value={editSchedule.planned_start_date}
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
                  value={editSchedule.planned_end_date}
                  onChange={(e) => handleChange('planned_end_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Planned Start Date</h4>
                  <p className="mt-1">{formatDate(schedule?.planned_start_date || change.planned_start_date)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Planned End Date</h4>
                  <p className="mt-1">{formatDate(schedule?.planned_end_date || change.planned_end_date)}</p>
                </div>
              </div>
            </div>
          )}
          
          {isEditing && canEdit && (
            <div className="mt-4">
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveSchedule}
                disabled={isSubmitting}
                className={`flex items-center ${getButtonColorClass('primary')}`}
              >
                {isSubmitting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <ClockIcon className="h-4 w-4 mr-1" />
                )}
                Save Schedule
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Actual Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Actual Implementation</h3>
        </div>
        <div className="p-6">
          {canEditActualDates && isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="actual_start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Start Date
                </label>
                <input
                  id="actual_start_date"
                  type="datetime-local"
                  value={editSchedule.actual_start_date}
                  onChange={(e) => handleChange('actual_start_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="actual_end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual End Date
                </label>
                <input
                  id="actual_end_date"
                  type="datetime-local"
                  value={editSchedule.actual_end_date}
                  onChange={(e) => handleChange('actual_end_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Actual Start Date</h4>
                  <p className="mt-1">{formatDateTime(schedule?.actual_start_date)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Actual End Date</h4>
                  <p className="mt-1">{formatDateTime(schedule?.actual_end_date)}</p>
                </div>
              </div>
            </div>
          )}
          
          {!isEditing && canEditActualDates && (
            <div className="mt-4 flex space-x-3">
              {!schedule?.actual_start_date && change.status === 'implementation' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartImplementation}
                  disabled={isSubmitting}
                  className={`flex items-center ${getButtonColorClass('primary')}`}
                >
                  {isSubmitting ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <ClockIcon className="h-4 w-4 mr-1" />
                  )}
                  Start Implementation
                </Button>
              )}
              
              {schedule?.actual_start_date && !schedule?.actual_end_date && change.status === 'implementation' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompleteImplementation}
                  disabled={isSubmitting}
                  className={`flex items-center ${getButtonColorClass('success')}`}
                >
                  {isSubmitting ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <ClockIcon className="h-4 w-4 mr-1" />
                  )}
                  Complete Implementation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeSchedule;
