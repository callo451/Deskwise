import React from 'react';
import { Problem } from '../../types/database';
import { format } from 'date-fns';

interface ProblemWorkaroundProps {
  problem: Problem;
  isEditing: boolean;
  editedProblem: {
    workaround: string | null;
  };
  onEditChange: (field: string, value: any) => void;
}

const ProblemWorkaround: React.FC<ProblemWorkaroundProps> = ({
  problem,
  isEditing,
  editedProblem,
  onEditChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Workaround</h3>
        {problem.status === 'known_error' && !isEditing && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Known Error
          </span>
        )}
      </div>
      
      {isEditing ? (
        <div>
          <textarea
            rows={8}
            value={editedProblem.workaround || ''}
            onChange={(e) => onEditChange('workaround', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Describe any temporary workarounds for this problem"
          />
          <p className="mt-2 text-sm text-gray-500">
            Document any temporary workarounds that can be used until a permanent solution is implemented.
          </p>
        </div>
      ) : (
        <div>
          {problem.workaround ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="prose prose-sm max-w-none text-gray-900 whitespace-pre-wrap">
                {problem.workaround}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-gray-500 text-sm">No workaround has been documented for this problem.</p>
            </div>
          )}
        </div>
      )}

      {problem.status === 'known_error' && problem.workaround && !isEditing && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Known Error Information</h4>
          <p className="text-sm text-amber-700">
            This workaround has been added to the Known Error Database and can be referenced by support staff.
          </p>
          {problem.identified_date && (
            <p className="text-xs text-amber-600 mt-1">
              Added to KEDB on {format(new Date(problem.identified_date), 'PPP')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemWorkaround;
