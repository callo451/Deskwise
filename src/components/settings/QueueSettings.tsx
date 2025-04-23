import React, { useState, useEffect } from 'react';
import { getQueues, createQueue, updateQueue, deleteQueue, QueueItem } from '../../services/queueService';
import { Button } from '../ui/Button';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const QueueSettings: React.FC = () => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingQueue, setIsAddingQueue] = useState(false);
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getQueues();
      setQueues(data);
    } catch (err: any) {
      console.error('Error fetching queues:', err);
      setError(err.message || 'Failed to fetch queues');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const newQueue = await createQueue({
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
      });
      
      setQueues(prev => [...prev, newQueue]);
      setIsAddingQueue(false);
      resetForm();
    } catch (err: any) {
      console.error('Error adding queue:', err);
      setError(err.message || 'Failed to add queue');
    }
  };

  const handleUpdateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueueId) return;
    
    setError(null);
    
    try {
      const updatedQueue = await updateQueue(editingQueueId, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
      });
      
      setQueues(prev => prev.map(queue => 
        queue.id === editingQueueId ? updatedQueue : queue
      ));
      
      setEditingQueueId(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating queue:', err);
      setError(err.message || 'Failed to update queue');
    }
  };

  const handleDeleteQueue = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this queue? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      await deleteQueue(id);
      setQueues(prev => prev.filter(queue => queue.id !== id));
    } catch (err: any) {
      console.error('Error deleting queue:', err);
      setError(err.message || 'Failed to delete queue');
    }
  };

  const startEditing = (queue: QueueItem) => {
    setFormData({
      name: queue.name,
      description: queue.description || '',
      is_active: queue.is_active,
    });
    setEditingQueueId(queue.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
  };

  const cancelAction = () => {
    if (isAddingQueue) {
      setIsAddingQueue(false);
    }
    if (editingQueueId) {
      setEditingQueueId(null);
    }
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Queue Management</h2>
        {!isAddingQueue && !editingQueueId && (
          <Button 
            onClick={() => setIsAddingQueue(true)}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Queue
          </Button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}

      {(isAddingQueue || editingQueueId) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={editingQueueId ? handleUpdateQueue : handleAddQueue}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Queue Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelAction}
                  className="flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {editingQueueId ? 'Update Queue' : 'Add Queue'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queues.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No queues found. Create your first queue to get started.
                </td>
              </tr>
            ) : (
              queues.map(queue => (
                <tr key={queue.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {queue.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {queue.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      queue.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {queue.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(queue)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQueue(queue.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueueSettings;
