import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../../services/settingsService';
import { getQueues } from '../../services/queueService';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface CreateTicketFormProps {
  onCancel?: () => void;
  onSuccess?: (ticketId: string) => void;
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({ onCancel, onSuccess }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority_id: '',
    status_id: '',
    category_id: '',
    service_id: '',
    queue_id: '',
  });
  
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [queues, setQueues] = useState<{ id: string; name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string; color: string; is_default: boolean }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; color: string; is_default: boolean }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchQueues();
    fetchTicketSettings();
  }, []);

  const fetchTicketSettings = async () => {
    try {
      const [prioritiesData, statusesData, categoriesData] = await Promise.all([
        getTicketPriorities(),
        getTicketStatuses(),
        getTicketCategories()
      ]);
      
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setCategories(categoriesData);
      
      // Set default values if available
      const defaultPriority = prioritiesData.find(p => p.is_default);
      const defaultStatus = statusesData.find(s => s.is_default);
      
      if (defaultPriority) {
        setFormData(prev => ({ ...prev, priority_id: defaultPriority.id }));
      }
      
      if (defaultStatus) {
        setFormData(prev => ({ ...prev, status_id: defaultStatus.id }));
      }
    } catch (err) {
      console.error('Error fetching ticket settings:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setServices(data || []);
    } catch (err: any) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchQueues = async () => {
    try {
      const data = await getQueues();
      // Only show active queues
      const activeQueues = data.filter(queue => queue.is_active);
      setQueues(activeQueues);
    } catch (err: any) {
      console.error('Error fetching queues:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const ticket = await createTicket({
        title: formData.title,
        description: formData.description,
        priority_id: formData.priority_id || undefined,
        status_id: formData.status_id || undefined,
        category_id: formData.category_id || undefined,
        service_id: formData.service_id || undefined,
        queue_id: formData.queue_id || undefined,
      });
      
      if (onSuccess) {
        onSuccess(ticket.id);
      } else {
        navigate(`/tickets/${ticket.id}`);
      }
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Failed to create ticket');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/tickets');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="priority_id" className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                id="priority_id"
                name="priority_id"
                value={formData.priority_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select a priority</option>
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status_id" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status_id"
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a status</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="queue_id" className="block text-sm font-medium text-gray-700 mb-1">
                Queue
              </label>
              <select
                id="queue_id"
                name="queue_id"
                value={formData.queue_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a queue</option>
                {queues.map(queue => (
                  <option key={queue.id} value={queue.id}>
                    {queue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicketForm;
