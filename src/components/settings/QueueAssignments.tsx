import React, { useState, useEffect } from 'react';
import { 
  getQueueAssignments, 
  getAvailableUsers, 
  assignUserToQueue, 
  removeUserFromQueue, 
  QueueUser 
} from '../../services/queueService';
import { Button } from '../ui/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface QueueAssignmentsProps {
  queueId: string;
  queueName: string;
}

const QueueAssignments: React.FC<QueueAssignmentsProps> = ({ queueId, queueName }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<QueueUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [queueId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsData, usersData] = await Promise.all([
        getQueueAssignments(queueId),
        getAvailableUsers()
      ]);
      
      setAssignments(assignmentsData);
      
      // Filter out users already assigned to this queue
      const assignedUserIds = new Set(assignmentsData.map((a: any) => a.user_id));
      const filteredUsers = usersData.filter(user => !assignedUserIds.has(user.id));
      setAvailableUsers(filteredUsers);
      
      if (filteredUsers.length > 0) {
        setSelectedUserId(filteredUsers[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching queue assignments:', err);
      setError(err.message || 'Failed to fetch queue assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setError(null);
    
    try {
      await assignUserToQueue(queueId, selectedUserId);
      setIsAdding(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error assigning user to queue:', err);
      setError(err.message || 'Failed to assign user to queue');
    }
  };

  const handleRemoveUser = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this user from the queue?')) {
      return;
    }
    
    setError(null);
    
    try {
      await removeUserFromQueue(assignmentId);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error removing user from queue:', err);
      setError(err.message || 'Failed to remove user from queue');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mt-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Queue Assignments - {queueName}</h2>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="flex items-center"
            disabled={availableUsers.length === 0}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Assign User
          </Button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddUser} className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                id="user_id"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                {availableUsers.length === 0 ? (
                  <option value="" disabled>No available users</option>
                ) : (
                  availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={availableUsers.length === 0}>
                Add
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4">
        {assignments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No users assigned to this queue yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.user.first_name} {assignment.user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveUser(assignment.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueAssignments;
