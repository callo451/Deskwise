import React, { useState, useEffect } from 'react';
import { getChangeHistory } from '../../services/changeService';
import { fetchUsers } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ChangeHistoryProps {
  changeId: string;
}

interface HistoryEntry {
  id: string;
  change_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  user_id: string;
  created_at: string;
}

const ChangeHistory: React.FC<ChangeHistoryProps> = ({ changeId }) => {
  const { userDetails } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchHistory();
  }, [changeId]);
  
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch history and users in parallel
      const [historyData, usersData] = await Promise.all([
        getChangeHistory(changeId),
        userDetails?.tenant_id ? fetchUsers(userDetails.tenant_id) : []
      ]);
      
      // Sort history by created_at in descending order (newest first)
      const sortedHistory = historyData.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setHistory(sortedHistory);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP p');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };
  
  // Format field name for display
  const formatFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format value for display
  const formatValue = (field: string, value: string | null) => {
    if (value === null) return 'None';
    
    // Format based on field type
    switch (field) {
      case 'status':
        return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
      case 'change_type':
        return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
      case 'risk_level':
        return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
      case 'impact':
        return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
      case 'planned_start_date':
      case 'planned_end_date':
        return value ? formatDate(value) : 'None';
      case 'assigned_to':
      case 'requested_by':
        return value ? getUserName(value) : 'None';
      default:
        return value;
    }
  };
  
  // Group history entries by date
  const groupHistoryByDate = () => {
    const grouped: { [date: string]: HistoryEntry[] } = {};
    
    history.forEach(entry => {
      const date = format(parseISO(entry.created_at), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    
    return grouped;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  const groupedHistory = groupHistoryByDate();
  const dates = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {history.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">No history records found for this change.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Change History</h3>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {dates.map((date, dateIndex) => (
                  <li key={date}>
                    <div className="relative pb-8">
                      {dateIndex !== dates.length - 1 ? (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      
                      <div className="relative flex items-start space-x-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-500 mb-2 font-medium">
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </div>
                          
                          <div className="space-y-4">
                            {groupedHistory[date].map((entry) => (
                              <div key={entry.id} className="relative flex space-x-3">
                                <div>
                                  <div className="relative px-1">
                                    <div className="h-8 w-8 bg-gray-100 rounded-full ring-8 ring-white flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-500">
                                        {getUserName(entry.user_id).split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1 py-1.5">
                                  <div className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">
                                      {getUserName(entry.user_id)}
                                    </span>{' '}
                                    changed{' '}
                                    <span className="font-medium text-gray-900">
                                      {formatFieldName(entry.field)}
                                    </span>{' '}
                                    from{' '}
                                    <span className="font-medium text-gray-900">
                                      {formatValue(entry.field, entry.old_value)}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium text-gray-900">
                                      {formatValue(entry.field, entry.new_value)}
                                    </span>
                                    <span className="whitespace-nowrap text-gray-400 ml-2">
                                      {format(parseISO(entry.created_at), 'h:mm a')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeHistory;
