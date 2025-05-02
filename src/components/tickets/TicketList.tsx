import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../../services/settingsService';
import { fetchTicketIdSettings } from '../../services/ticketSettingsService';

import { Ticket } from '../../types/database';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatTicketIdWithSettings } from '../../utils/ticketIdFormatter';
import { 
  // DocumentIcon, 
  // ClockIcon, 
  // CheckCircleIcon,
  // XCircleIcon,
  // ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface TicketWithDetails extends Ticket {
  priority_details?: {
    id: string;
    name: string;
    color: string;
  };
  status_details?: {
    id: string;
    name: string;
    color: string;
  };
  category?: {
    id: string;
    name: string;
  };
  assigned_to_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  numeric_id?: number;
}

interface TicketListProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  initialFilters?: {
    status_id?: string | string[];
    priority_id?: string | string[];
    category_id?: string | string[];
    assigned_to?: string;
    created_by?: string;
    queue_id?: string;
    service_id?: string;
  };
}

const TicketList: React.FC<TicketListProps> = ({
  limit = 10,
  showFilters = true,
  showPagination = true,
  initialFilters = {},
}) => {
  const { userDetails } = useAuth();
  const isAdmin = userDetails?.role === 'admin';
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ticketIdSettings, setTicketIdSettings] = useState<{
    prefix: string;
    suffix: string;
    padding_length: number;
  } | null>(null);
  
  const [filters, setFilters] = useState({
    status_id: initialFilters.status_id || undefined,
    priority_id: initialFilters.priority_id || undefined,
    category_id: initialFilters.category_id || undefined,
    assigned_to: initialFilters.assigned_to || undefined,
    created_by: initialFilters.created_by || undefined,
    queue_id: initialFilters.queue_id || undefined,
    service_id: initialFilters.service_id || undefined,
  });

  useEffect(() => {
    fetchTickets();
    fetchSettings();
    if (userDetails?.tenant_id) {
      fetchTicketIdSettings(userDetails.tenant_id)
        .then(settings => {
          if (settings) {
            setTicketIdSettings({
              prefix: settings.prefix,
              suffix: settings.suffix,
              padding_length: settings.padding_length
            });
          }
        })
        .catch(err => console.error('Error fetching ticket ID settings:', err));
    }
  }, [page, filters, userDetails?.tenant_id]);

  const fetchSettings = async () => {
    try {
      const [prioritiesData, statusesData, categoriesData] = await Promise.all([
        getTicketPriorities(),
        getTicketStatuses(),
        getTicketCategories()
      ]);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      const { tickets: fetchedTickets, count } = await getTickets({
        ...filters,
        limit,
        offset,
      });
      
      setTickets(fetchedTickets as TicketWithDetails[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!isAdmin) return;
    
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simple direct deletion
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);
      
      if (error) {
        throw error;
      }
      
      // Refresh the ticket list
      fetchTickets();
      // Show success message
      alert('Ticket deleted successfully');
    } catch (err: any) {
      console.error('Error deleting ticket:', err);
      setError(err.message || 'Failed to delete ticket');
      // Show error message to user
      alert(`Failed to delete ticket: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status_id: undefined,
      priority_id: undefined,
      category_id: undefined,
      assigned_to: undefined,
      created_by: undefined,
      queue_id: undefined,
      service_id: undefined,
    });
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {showFilters && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.status_id as string || ''}
                onChange={(e) => handleFilterChange('status_id', e.target.value || undefined)}
              >
                <option value="">All</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.priority_id as string || ''}
                onChange={(e) => handleFilterChange('priority_id', e.target.value || undefined)}
              >
                <option value="">All</option>
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="category-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.category_id as string || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value || undefined)}
              >
                <option value="">All</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTickets} className="mt-2">
            Retry
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No tickets found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                      {ticketIdSettings
                        ? formatTicketIdWithSettings(ticket.id, ticketIdSettings)
                        : ticket.id.substring(0, 8)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div>
                        <Link to={`/tickets/${ticket.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {ticket.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.status_details ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: `${ticket.status_details.color}20`,
                        color: ticket.status_details.color
                      }}>
                        <span>{ticket.status_details.name}</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.priority_details ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: `${ticket.priority_details.color}20`,
                        color: ticket.priority_details.color
                      }}>
                        {ticket.priority_details.name}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.category ? ticket.category.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.assigned_to_user ? (
                      <span>
                        {ticket.assigned_to_user.first_name || ''} {ticket.assigned_to_user.last_name || ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteTicket(ticket.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Ticket"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page + i - 2;
                  if (pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                  onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
