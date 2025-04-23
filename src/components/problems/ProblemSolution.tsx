import React from 'react';
import { Problem } from '../../types/database';
import { format } from 'date-fns';

interface ProblemSolutionProps {
  problem: Problem;
  isEditing: boolean;
  editedProblem: {
    permanent_solution: string | null;
  };
  onEditChange: (field: string, value: any) => void;
}

const ProblemSolution: React.FC<ProblemSolutionProps> = ({
  problem,
  isEditing,
  editedProblem,
  onEditChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Permanent Solution</h3>
        {problem.status === 'resolved' && !isEditing && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Resolved
          </span>
        )}
      </div>
      
      {isEditing ? (
        <div>
          <textarea
            rows={8}
            value={editedProblem.permanent_solution || ''}
            onChange={(e) => onEditChange('permanent_solution', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe the permanent solution for this problem"
          />
          <p className="mt-2 text-sm text-gray-500">
            Document the permanent solution that resolves the root cause of this problem.
          </p>
        </div>
      ) : (
        <div>
          {problem.permanent_solution ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="prose prose-sm max-w-none text-gray-900 whitespace-pre-wrap">
                {problem.permanent_solution}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-gray-500 text-sm">No permanent solution has been documented for this problem.</p>
            </div>
          )}
        </div>
      )}

      {problem.status === 'resolved' && problem.permanent_solution && problem.resolved_date && !isEditing && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-1">Resolution Information</h4>
          <p className="text-sm text-green-700">
            This problem has been resolved with the permanent solution documented above.
          </p>
          <p className="text-xs text-green-600 mt-1">
            Resolved on {format(new Date(problem.resolved_date), 'PPP')}
          </p>
        </div>
      )}

      {problem.status === 'closed' && problem.permanent_solution && problem.closed_date && !isEditing && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-800 mb-1">Closure Information</h4>
          <p className="text-sm text-gray-700">
            This problem has been closed after implementing the permanent solution.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Closed on {format(new Date(problem.closed_date), 'PPP')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProblemSolution;
