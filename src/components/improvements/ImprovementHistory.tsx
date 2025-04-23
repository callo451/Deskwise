import React from 'react';
import { format } from 'date-fns';
import { Improvement } from '../../types/database';

interface ImprovementHistoryProps {
  improvement: Improvement;
}

const ImprovementHistory: React.FC<ImprovementHistoryProps> = ({ improvement }) => {
  // Handle the case where improvement_history might not be in the type definition
  const historyItems = (improvement as any).improvement_history || [];
  
  if (historyItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No history records found</p>
      </div>
    );
  }
  
  // Sort history items by created_at in descending order (newest first)
  const sortedHistory = [...historyItems].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedHistory.map((historyItem, index) => (
          <li key={historyItem.id}>
            <div className="relative pb-8">
              {index !== sortedHistory.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <svg
                      className="h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{historyItem.action}</span>
                    </p>
                    {historyItem.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-2 rounded-md">
                          {JSON.stringify(historyItem.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={historyItem.created_at}>
                      {format(new Date(historyItem.created_at), 'MMM d, yyyy h:mm a')}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ImprovementHistory;
