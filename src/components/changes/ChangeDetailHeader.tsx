import React from 'react';
import { Change } from '../../types/database';
import { Button } from '../ui/Button';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ChangeDetailHeaderProps {
  change: Change;
  isEditing: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ChangeDetailHeader: React.FC<ChangeDetailHeaderProps> = ({
  change,
  isEditing,
  canEdit,
  isSaving,
  onBack,
  onEdit,
  onSave,
  onCancel
}) => {
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

  // Get change type badge color
  const getChangeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'standard':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'pre-approved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Change #{change.id.substring(0, 8)}
              </h1>
              <span 
                className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getStatusBadgeColor(change.status).split(' ')[0],
                  color: getStatusBadgeColor(change.status).split(' ')[1]
                }}
              >
                {change.status.charAt(0).toUpperCase() + change.status.slice(1).replace('_', ' ')}
              </span>
              <span 
                className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getChangeTypeBadgeColor(change.change_type).split(' ')[0],
                  color: getChangeTypeBadgeColor(change.change_type).split(' ')[1]
                }}
              >
                {change.change_type.charAt(0).toUpperCase() + change.change_type.slice(1).replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg text-gray-700 mt-1">{change.title}</h2>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel}
                disabled={isSaving}
                className="flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEdit}
                className="flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeDetailHeader;
