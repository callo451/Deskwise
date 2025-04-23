import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getChanges } from '../../services/changeService';
import { getTicketCategories } from '../../services/settingsService';
import { getServices } from '../../services/serviceService';
import { Change, ChangeStatus, ChangeType, ChangeRiskLevel, ChangeImpact } from '../../types/database';
import { Button } from '../ui/Button';
import { 
  DocumentIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ChangeWithDetails extends Change {
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
  requested_by_user?: {
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
  approvals?: {
    id: string;
    approver_id: string;
    status: 'pending' | 'approved' | 'rejected';
    approval_date: string | null;
    approver?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  }[];
  schedule?: {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    maintenance_window: boolean;
  }[];
}

interface ChangeListProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  initialFilters?: {
    status?: ChangeStatus | ChangeStatus[];
    change_type?: ChangeType | ChangeType[];
    risk_level?: ChangeRiskLevel | ChangeRiskLevel[];
    impact?: ChangeImpact | ChangeImpact[];
    assigned_to?: string;
    created_by?: string;
    requested_by?: string;
    service_id?: string;
    category_id?: string;
  };
}

const ChangeList: React.FC<ChangeListProps> = ({
  limit = 10,
  showFilters = true,
  showPagination = true,
  initialFilters = {},
}) => {
  const [changes, setChanges] = useState<ChangeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    status: initialFilters.status || undefined,
    change_type: initialFilters.change_type || undefined,
    risk_level: initialFilters.risk_level || undefined,
    impact: initialFilters.impact || undefined,
    assigned_to: initialFilters.assigned_to || undefined,
    created_by: initialFilters.created_by || undefined,
    requested_by: initialFilters.requested_by || undefined,
    service_id: initialFilters.service_id || undefined,
    category_id: initialFilters.category_id || undefined,
  });

  useEffect(() => {
    fetchChanges();
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

  const fetchChanges = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      const { changes: fetchedChanges, count } = await getChanges({
        ...filters,
        limit,
        offset,
      });
      
      setChanges(fetchedChanges as ChangeWithDetails[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching changes:', err);
      setError(err.message || 'Failed to fetch changes');
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
      change_type: undefined,
      risk_level: undefined,
      impact: undefined,
      assigned_to: undefined,
      created_by: undefined,
      requested_by: undefined,
      service_id: undefined,
      category_id: undefined,
    });
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const getStatusBadgeColor = (status: ChangeStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'assessment':
        return 'bg-indigo-100 text-indigo-800';
      case 'approval':
        return 'bg-purple-100 text-purple-800';
      case 'scheduled':
        return 'bg-cyan-100 text-cyan-800';
      case 'implementation':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeBadgeColor = (type: ChangeType) => {
    switch (type) {
      case 'standard':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'pre-approved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelBadgeColor = (risk: ChangeRiskLevel) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'very_high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ChangeStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'assessment':
        return 'Assessment';
      case 'approval':
        return 'Approval';
      case 'scheduled':
        return 'Scheduled';
      case 'implementation':
        return 'Implementation';
      case 'review':
        return 'Review';
      case 'closed':
        return 'Closed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ChangeStatus) => {
    switch (status) {
      case 'draft':
        return <DocumentIcon className="h-4 w-4" />;
      case 'submitted':
        return <DocumentIcon className="h-4 w-4" />;
      case 'assessment':
        return <ClockIcon className="h-4 w-4" />;
      case 'approval':
        return <ClockIcon className="h-4 w-4" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4" />;
      case 'implementation':
        return <ArrowPathIcon className="h-4 w-4" />;
      case 'review':
        return <ClockIcon className="h-4 w-4" />;
      case 'closed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'cancelled':
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
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="assessment">Assessment</option>
                <option value="approval">Approval</option>
                <option value="scheduled">Scheduled</option>
                <option value="implementation">Implementation</option>
                <option value="review">Review</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="change-type-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Change Type
              </label>
              <select
                id="change-type-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.change_type as string || ''}
                onChange={(e) => handleFilterChange('change_type', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="standard">Standard</option>
                <option value="normal">Normal</option>
                <option value="emergency">Emergency</option>
                <option value="pre-approved">Pre-approved</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="risk-level-filter" className="block text-xs font-medium text-gray-500 mb-1">
                Risk Level
              </label>
              <select
                id="risk-level-filter"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={filters.risk_level as string || ''}
                onChange={(e) => handleFilterChange('risk_level', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
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
          <p className="mt-2 text-sm text-gray-500">Loading changes...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchChanges} className="mt-2">
            Retry
          </Button>
        </div>
      ) : changes.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No changes found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {changes.map((change) => (
                <tr key={change.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div>
                        <Link to={`/changes/${change.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {change.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(change.status)}`}>
                      {getStatusIcon(change.status)}
                      <span className="ml-1">{getStatusLabel(change.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeTypeBadgeColor(change.change_type)}`}>
                      {change.change_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelBadgeColor(change.risk_level)}`}>
                      {change.risk_level.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {change.service?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {change.assigned_to_user ? (
                      <span>
                        {change.assigned_to_user.first_name || ''} {change.assigned_to_user.last_name || ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {change.schedule && change.schedule.length > 0 ? (
                      <span>
                        {formatDistanceToNow(new Date(change.schedule[0].scheduled_start), { addSuffix: true })}
                      </span>
                    ) : change.planned_start_date ? (
                      <span>
                        {formatDistanceToNow(new Date(change.planned_start_date), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not scheduled</span>
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

export default ChangeList;
