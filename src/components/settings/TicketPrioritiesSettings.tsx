import React, { useState, useEffect } from 'react';
import { getTicketPriorities, createTicketPriority, updateTicketPriority, deleteTicketPriority } from '../../services/settingsService';
import { TicketPriorityItem } from '../../services/settingsService';
import { Button } from '../ui/Button';

const TicketPrioritiesSettings: React.FC = () => {
  const [priorities, setPriorities] = useState<TicketPriorityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<TicketPriorityItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    color: '#10B981',
    description: '',
    sort_order: 0,
    is_default: false
  });

  useEffect(() => {
    fetchPriorities();
  }, []);

  const fetchPriorities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTicketPriorities();
      setPriorities(data);
    } catch (err: any) {
      console.error('Error fetching priorities:', err);
      setError(err.message || 'Failed to fetch priorities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCreatePriority = () => {
    setEditingPriority(null);
    setFormData({
      name: '',
      color: '#10B981',
      description: '',
      sort_order: priorities.length > 0 ? Math.max(...priorities.map(p => p.sort_order)) + 10 : 10,
      is_default: false
    });
    setIsCreating(true);
  };

  const handleEditPriority = (priority: TicketPriorityItem) => {
    setIsCreating(false);
    setEditingPriority(priority);
    setFormData({
      name: priority.name,
      color: priority.color,
      description: priority.description || '',
      sort_order: priority.sort_order,
      is_default: priority.is_default
    });
  };

  const handleCancelEdit = () => {
    setEditingPriority(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      if (isCreating) {
        const newPriority = await createTicketPriority(formData);
        setPriorities(prev => [...prev, newPriority]);
        setIsCreating(false);
      } else if (editingPriority) {
        const updatedPriority = await updateTicketPriority(editingPriority.id, formData);
        setPriorities(prev => 
          prev.map(p => p.id === updatedPriority.id ? updatedPriority : p)
        );
        setEditingPriority(null);
      }
    } catch (err: any) {
      console.error('Error saving priority:', err);
      setError(err.message || 'Failed to save priority');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePriority = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this priority? This cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      await deleteTicketPriority(id);
      setPriorities(prev => prev.filter(p => p.id !== id));
      
      if (editingPriority?.id === id) {
        setEditingPriority(null);
      }
    } catch (err: any) {
      console.error('Error deleting priority:', err);
      setError(err.message || 'Failed to delete priority');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading priorities...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Ticket Priorities</h2>
        {!isCreating && !editingPriority && (
          <Button onClick={handleCreatePriority}>
            Add Priority
          </Button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {(isCreating || editingPriority) ? (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isCreating ? 'Create New Priority' : 'Edit Priority'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
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
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="h-10 w-10 border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order *
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                required
              />
            </div>
            
            <div className="flex items-center h-full pt-6">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                Set as default priority
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Priority'}
            </Button>
          </div>
        </form>
      ) : null}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {priorities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No priorities found. Create your first priority.
                </td>
              </tr>
            ) : (
              priorities.map((priority) => (
                <tr key={priority.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="h-6 w-6 rounded" 
                      style={{ backgroundColor: priority.color }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {priority.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {priority.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {priority.sort_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {priority.is_default ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditPriority(priority)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeletePriority(priority.id)}
                      >
                        Delete
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

export default TicketPrioritiesSettings;
