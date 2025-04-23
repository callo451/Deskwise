import React from 'react';
import { Problem } from '../../types/database';
import { Button } from '../ui/Button';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ProblemDetailHeaderProps {
  problem: Problem;
  isEditing: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProblemDetailHeader: React.FC<ProblemDetailHeaderProps> = ({
  problem,
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
      case 'identified':
        return 'bg-blue-100 text-blue-800';
      case 'investigating':
        return 'bg-purple-100 text-purple-800';
      case 'diagnosed':
        return 'bg-indigo-100 text-indigo-800';
      case 'known_error':
        return 'bg-amber-100 text-amber-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
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
                Problem #{problem.id.substring(0, 8)}
              </h1>
              <span 
                className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getStatusBadgeColor(problem.status).split(' ')[0],
                  color: getStatusBadgeColor(problem.status).split(' ')[1]
                }}
              >
                {problem.status.charAt(0).toUpperCase() + problem.status.slice(1).replace('_', ' ')}
              </span>
              <span 
                className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getPriorityBadgeColor(problem.priority).split(' ')[0],
                  color: getPriorityBadgeColor(problem.priority).split(' ')[1]
                }}
              >
                {problem.priority.charAt(0).toUpperCase() + problem.priority.slice(1)}
              </span>
              {problem.known_error_db_entry && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Known Error
                </span>
              )}
            </div>
            <h2 className="text-lg text-gray-700 mt-1">{problem.title}</h2>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center"
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

export default ProblemDetailHeader;
