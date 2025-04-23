import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../../services/settingsService';
import { Ticket } from '../../types/database';
import { Button } from '../ui/Button';

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
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
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
  }, [page, filters]);

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
      
      setTickets(fetchedTickets as Ticket[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets');
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
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={fetchTickets}>
            Retry
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No tickets found.</p>
          <Button className="mt-4" asChild>
            <Link to="/tickets/new">Create Ticket</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Priority</th>
                  <th className="px-6 py-3 text-left">Created</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/tickets/${ticket.id}`} className="hover:text-primary">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.status_details ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${ticket.status_details.color}20`, // 20 is for opacity
                            color: ticket.status_details.color
                          }}>
                          {ticket.status_details.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {ticket.status || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.priority_details ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${ticket.priority_details.color}20`, // 20 is for opacity
                            color: ticket.priority_details.color
                          }}>
                          {ticket.priority_details.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {ticket.priority || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/tickets/${ticket.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showPagination && totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} tickets
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicketList;
