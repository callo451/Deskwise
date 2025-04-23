import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

import { getImprovements } from '../../services/improvementService';
import { Improvement, ImprovementStatus, ImprovementPriority, ImprovementCategory } from '../../types/database';
import { Button } from '../ui/Button';



interface ImprovementListProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  initialFilters?: {
    status?: ImprovementStatus | ImprovementStatus[];
    priority?: ImprovementPriority | ImprovementPriority[];
    category?: ImprovementCategory | ImprovementCategory[];
    assigned_to?: string;
    service_id?: string;
  };
}

const ImprovementList: React.FC<ImprovementListProps> = ({ 
  limit = 50,
  showFilters = true,
  showPagination = true,
  initialFilters = {}
}) => {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ImprovementStatus[]>(
    initialFilters.status ? (Array.isArray(initialFilters.status) ? initialFilters.status : [initialFilters.status]) : []
  );
  const [priorityFilter, setPriorityFilter] = useState<ImprovementPriority[]>(
    initialFilters.priority ? (Array.isArray(initialFilters.priority) ? initialFilters.priority : [initialFilters.priority]) : []
  );
  const [categoryFilter, setCategoryFilter] = useState<ImprovementCategory[]>(
    initialFilters.category ? (Array.isArray(initialFilters.category) ? initialFilters.category : [initialFilters.category]) : []
  );
  const [assignedToFilter, setAssignedToFilter] = useState<string | null>(initialFilters.assigned_to || null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(initialFilters.service_id || null);
  
  // Sorting
  const [sortField] = useState<string>('created_at');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');

  // Status options
  const statusOptions: { value: ImprovementStatus; label: string; color: string }[] = [
    { value: 'proposed', label: 'Proposed', color: 'bg-gray-100 text-gray-800' },
    { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  // Priority options
  const priorityOptions: { value: ImprovementPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  // Category options
  const categoryOptions: { value: ImprovementCategory; label: string; color: string }[] = [
    { value: 'process', label: 'Process', color: 'bg-blue-100 text-blue-800' },
    { value: 'service', label: 'Service', color: 'bg-green-100 text-green-800' },
    { value: 'technology', label: 'Technology', color: 'bg-purple-100 text-purple-800' },
    { value: 'people', label: 'People', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchImprovements();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, assignedToFilter, serviceFilter, sortField, sortDirection]);

  const fetchImprovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * limit;
      
      const filters: any = {};
      
      if (statusFilter.length > 0) {
        filters.status = statusFilter;
      }
      
      if (priorityFilter.length > 0) {
        filters.priority = priorityFilter;
      }
      
      if (categoryFilter.length > 0) {
        filters.category = categoryFilter;
      }
      
      if (assignedToFilter) {
        filters.assigned_to = assignedToFilter;
      }
      
      if (serviceFilter) {
        filters.service_id = serviceFilter;
      }
      
      const { improvements, count } = await getImprovements({
        ...filters,
        limit,
        offset,
        orderBy: sortField,
        orderDirection: sortDirection
      });
      
      setImprovements(improvements);
      setTotalCount(count || 0);
    } catch (err) {
      setError('Failed to load improvements');
      console.error('Error fetching improvements:', err);
    } finally {
      setLoading(false);
    }
  };



  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setCategoryFilter([]);
    setAssignedToFilter(null);
    setServiceFilter(null);
    setSearchQuery('');
  };

  const getStatusBadgeClass = (status: ImprovementStatus) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeClass = (priority: ImprovementPriority) => {
    const priorityOption = priorityOptions.find(option => option.value === priority);
    return priorityOption ? priorityOption.color : 'bg-gray-100 text-gray-800';
  };

  const getCategoryBadgeClass = (category: ImprovementCategory) => {
    const categoryOption = categoryOptions.find(option => option.value === category);
    return categoryOption ? categoryOption.color : 'bg-gray-100 text-gray-800';
  };

  const filteredImprovements = searchQuery
    ? improvements.filter(improvement => 
        improvement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        improvement.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : improvements;

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
                value={statusFilter.length === 1 ? statusFilter[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setStatusFilter([e.target.value as ImprovementStatus]);
                  } else {
                    setStatusFilter([]);
                  }
                }}
              >
                <option value="">All</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                value={priorityFilter.length === 1 ? priorityFilter[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setPriorityFilter([e.target.value as ImprovementPriority]);
                  } else {
                    setPriorityFilter([]);
                  }
                }}
              >
                <option value="">All</option>
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                value={categoryFilter.length === 1 ? categoryFilter[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setCategoryFilter([e.target.value as ImprovementCategory]);
                  } else {
                    setCategoryFilter([]);
                  }
                }}
              >
                <option value="">All</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
      
      {error && (
        <div className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={fetchImprovements}>
            Retry
          </Button>
        </div>
      )}
      
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading improvements...</p>
        </div>
      ) : filteredImprovements.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No improvements found</p>
          {(statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter.length > 0 || assignedToFilter || serviceFilter || searchQuery) && (
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Created</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredImprovements.map((improvement) => (
                <tr key={improvement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/improvements/${improvement.id}`} className="hover:text-primary">
                      {improvement.title}
                    </Link>
                    <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                      {improvement.description.length > 60 ? improvement.description.substring(0, 60) + '...' : improvement.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(improvement.status)}`}>
                      {improvement.status.replace('_', ' ').charAt(0).toUpperCase() + improvement.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(improvement.priority)}`}>
                      {improvement.priority.charAt(0).toUpperCase() + improvement.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(improvement.category)}`}>
                      {improvement.category.charAt(0).toUpperCase() + improvement.category.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(improvement.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/improvements/${improvement.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showPagination && totalCount > limit && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} improvements
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / limit), p + 1))}
              disabled={currentPage * limit >= totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementList;
