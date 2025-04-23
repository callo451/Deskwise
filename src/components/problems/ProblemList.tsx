import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProblems } from '../../services/problemService';
import { getTicketCategories } from '../../services/settingsService';
import { getServices } from '../../services/serviceService';
import { Problem, ProblemStatus, ProblemPriority, ProblemImpact, ProblemUrgency } from '../../types/database';
import { Button } from '../ui/Button';
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ProblemWithDetails extends Problem {
  created_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  related_tickets?: { ticket_id: string }[];
}

interface ProblemListProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  initialFilters?: {
    status?: ProblemStatus | ProblemStatus[];
    priority?: ProblemPriority | ProblemPriority[];
    impact?: ProblemImpact | ProblemImpact[];
    urgency?: ProblemUrgency | ProblemUrgency[];
    assigned_to?: string;
    created_by?: string;
    service_id?: string;
    category_id?: string;
    known_error_only?: boolean;
  };
}

const ProblemList: React.FC<ProblemListProps> = ({
  limit = 10,
  showFilters = true,
  showPagination = true,
  initialFilters = {},
}) => {
  const [problems, setProblems] = useState<ProblemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    status: initialFilters.status || undefined,
    priority: initialFilters.priority || undefined,
    impact: initialFilters.impact || undefined,
    urgency: initialFilters.urgency || undefined,
    assigned_to: initialFilters.assigned_to || undefined,
    created_by: initialFilters.created_by || undefined,
    service_id: initialFilters.service_id || undefined,
    category_id: initialFilters.category_id || undefined,
    known_error_only: initialFilters.known_error_only || undefined,
  });

  useEffect(() => {
    fetchProblems();
    fetchSettings();
  }, [page, filters]);

  const fetchSettings = async () => {
    try {
      const [categoriesData, servicesData] = await Promise.all([
        getTicketCategories(),
        getServices()
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchProblems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      const { problems: fetchedProblems, count } = await getProblems({
        ...filters,
        limit,
        offset,
      });
      
      setProblems(fetchedProblems as ProblemWithDetails[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching problems:', err);
      setError(err.message || 'Failed to fetch problems');
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
      status: undefined,
      priority: undefined,
      impact: undefined,
      urgency: undefined,
      assigned_to: undefined,
      created_by: undefined,
      service_id: undefined,
      category_id: undefined,
      known_error_only: undefined,
    });
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const getStatusBadgeColor = (status: ProblemStatus) => {
    switch (status) {
      case 'identified':
        return 'bg-blue-100 text-blue-800';
      case 'investigating':
        return 'bg-purple-100 text-purple-800';
      case 'diagnosed':
        return 'bg-indigo-100 text-indigo-800';
      case 'known_error':
        return 'bg-amber-100 text-amber-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: ProblemPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ProblemStatus) => {
    switch (status) {
      case 'identified':
        return 'Identified';
      case 'investigating':
        return 'Investigating';
      case 'diagnosed':
        return 'Diagnosed';
      case 'known_error':
        return 'Known Error';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ProblemStatus) => {
    switch (status) {
      case 'identified':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'investigating':
        return <MagnifyingGlassIcon className="h-4 w-4" />;
      case 'diagnosed':
        return <ClockIcon className="h-4 w-4" />;
      case 'known_error':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'closed':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

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
                value={filters.status as string || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="identified">Identified</option>
                <option value="investigating">Investigating</option>
                <option value="diagnosed">Diagnosed</option>
                <option value="known_error">Known Error</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.priority as string || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
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

            <div>
              <label htmlFor="service-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Service
              </label>
              <select
                id="service-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.service_id as string || ''}
                onChange={(e) => handleFilterChange('service_id', e.target.value || undefined)}
              >
                <option value="">All</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="known-error-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Known Error
              </label>
              <select
                id="known-error-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.known_error_only ? 'true' : ''}
                onChange={(e) => handleFilterChange('known_error_only', e.target.value === 'true' ? true : undefined)}
              >
                <option value="">All</option>
                <option value="true">Known Errors Only</option>
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
          <p className="mt-2 text-sm text-gray-500">Loading problems...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProblems} className="mt-2">
            Retry
          </Button>
        </div>
      ) : problems.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No problems found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Problem
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Related Tickets
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div>
                        <Link to={`/problems/${problem.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {problem.title}
                        </Link>
                        {problem.known_error_db_entry && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Known Error
                          </span>
                        )}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(problem.status)}`}>
                      {getStatusIcon(problem.status)}
                      <span className="ml-1">{getStatusLabel(problem.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(problem.priority)}`}>
                      {problem.priority.charAt(0).toUpperCase() + problem.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {problem.service?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {problem.assigned_to_user ? (
                      <span>
                        {problem.assigned_to_user.first_name || ''} {problem.assigned_to_user.last_name || ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(problem.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {problem.related_tickets ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {problem.related_tickets.length}
                      </span>
                    ) : (
                      <span>0</span>
                    )}
                  </td>
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

export default ProblemList;
