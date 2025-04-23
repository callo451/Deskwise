import React from 'react';
import { Problem, ProblemHistory as ProblemHistoryType } from '../../types/database';
import { format } from 'date-fns';

interface ProblemHistoryProps {
  problem: Problem & {
    problem_history?: ProblemHistoryType[];
  };
}

const ProblemHistory: React.FC<ProblemHistoryProps> = ({ problem }) => {
  const history = problem.problem_history || [];

  // Sort history by created_at in descending order (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '🆕';
      case 'updated':
        return '✏️';
      case 'status_changed':
        return '🔄';
      case 'linked_ticket':
        return '🔗';
      case 'unlinked_ticket':
        return '❌';
      case 'linked_to_change':
        return '📝';
      case 'unlinked_from_change':
        return '❌';
      default:
        return '📋';
    }
  };

  const getActionText = (historyItem: ProblemHistoryType) => {
    const { action, details } = historyItem;
    
    switch (action) {
      case 'created':
        return 'Problem was created';
      
      case 'updated':
        if (details?.changes) {
          const changes = Object.keys(details.changes)
            .map(key => {
              const change = details.changes[key];
              const fieldName = key.replace(/_/g, ' ');
              
              if (key === 'status') {
                return `Status changed from "${change.from}" to "${change.to}"`;
              }
              
              if (key === 'priority' || key === 'impact' || key === 'urgency') {
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} changed from "${change.from}" to "${change.to}"`;
              }
              
              if (key === 'known_error_db_entry') {
                return change.to 
                  ? 'Added to Known Error Database' 
                  : 'Removed from Known Error Database';
              }
              
              return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} was updated`;
            })
            .join(', ');
          
          return changes;
        }
        return 'Problem was updated';
      
      case 'status_changed':
        return `Status changed from "${details?.from}" to "${details?.to}"`;
      
      case 'linked_ticket':
        return `Ticket #${details?.ticket_id.substring(0, 8)} was linked to this problem`;
      
      case 'unlinked_ticket':
        return `Ticket #${details?.ticket_id.substring(0, 8)} was unlinked from this problem`;
      
      case 'linked_to_change':
        return `Linked to Change #${details?.change_id.substring(0, 8)}`;
      
      case 'unlinked_from_change':
        return `Unlinked from Change #${details?.change_id.substring(0, 8)}`;
      
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Problem History</h3>
      
      {sortedHistory.length > 0 ? (
        <div className="flow-root">
          <ul className="-mb-8">
            {sortedHistory.map((historyItem, index) => (
              <li key={historyItem.id}>
                <div className="relative pb-8">
                  {index !== sortedHistory.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                        <span className="text-lg">{getActionIcon(historyItem.action)}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {historyItem.user_id.substring(0, 8)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {format(new Date(historyItem.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{getActionText(historyItem)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-gray-500 text-sm">No history available for this problem.</p>
        </div>
      )}
    </div>
  );
};

export default ProblemHistory;
