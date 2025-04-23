import React from 'react';
import { Problem } from '../../types/database';
import { formatDistanceToNow, format } from 'date-fns';

interface ProblemDetailViewProps {
  problem: Problem & {
    created_by_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
    assigned_to_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
    service?: {
      id: string;
      name: string;
    } | null;
    category?: {
      id: string;
      name: string;
    } | null;
  };
}

const ProblemDetailView: React.FC<ProblemDetailViewProps> = ({ problem }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {problem.description}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Symptoms</h3>
            <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {problem.symptoms || 'No symptoms documented'}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Root Cause</h3>
            <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {problem.root_cause || 'Root cause not yet identified'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Problem Details</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium text-gray-900">
                  {problem.status.charAt(0).toUpperCase() + problem.status.slice(1).replace('_', ' ')}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Priority</div>
                <div className="font-medium text-gray-900">
                  {problem.priority.charAt(0).toUpperCase() + problem.priority.slice(1)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Impact</div>
                <div className="font-medium text-gray-900">
                  {problem.impact.charAt(0).toUpperCase() + problem.impact.slice(1)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Urgency</div>
                <div className="font-medium text-gray-900">
                  {problem.urgency.charAt(0).toUpperCase() + problem.urgency.slice(1)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Category</div>
                <div className="font-medium text-gray-900">
                  {problem.category?.name || 'None'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Service</div>
                <div className="font-medium text-gray-900">
                  {problem.service?.name || 'None'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Created By</div>
                <div className="font-medium text-gray-900">
                  {problem.created_by_user ? 
                    `${problem.created_by_user.first_name || ''} ${problem.created_by_user.last_name || ''}`.trim() || 
                    problem.created_by_user.email : 
                    'Unknown'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Assigned To</div>
                <div className="font-medium text-gray-900">
                  {problem.assigned_to_user ? 
                    `${problem.assigned_to_user.first_name || ''} ${problem.assigned_to_user.last_name || ''}`.trim() || 
                    problem.assigned_to_user.email : 
                    'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Dates</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Identified Date</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(problem.identified_date), 'PPP')}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(problem.identified_date), { addSuffix: true })}
                </div>
              </div>
              
              {problem.resolved_date && (
                <div>
                  <div className="text-gray-500">Resolved Date</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(problem.resolved_date), 'PPP')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(problem.resolved_date), { addSuffix: true })}
                  </div>
                </div>
              )}
              
              {problem.closed_date && (
                <div>
                  <div className="text-gray-500">Closed Date</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(problem.closed_date), 'PPP')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(problem.closed_date), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {problem.known_error_db_entry && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Known Error</h3>
              <p className="text-sm text-amber-700">
                This problem has been added to the Known Error Database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailView;
