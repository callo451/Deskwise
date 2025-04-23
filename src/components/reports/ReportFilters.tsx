import React, { useState } from 'react';
import { format } from 'date-fns';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface ReportFiltersProps {
  onFilterChange: (filters: {
    dateRange: DateRange;
    categories: string[];
    priorities: string[];
    statuses: string[];
    assignees: string[];
    queues: string[];
  }) => void;
  categories: { id: string; name: string }[];
  priorities: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
  queues: { id: string; name: string }[];
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  onFilterChange,
  categories,
  priorities,
  statuses,
  assignees,
  queues
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
    endDate: new Date()
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);

  const handleDateRangeChange = (type: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value ? new Date(value) : null
    }));
  };

  const handleMultiSelectChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const applyFilters = () => {
    onFilterChange({
      dateRange,
      categories: selectedCategories,
      priorities: selectedPriorities,
      statuses: selectedStatuses,
      assignees: selectedAssignees,
      queues: selectedQueues
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium mb-4">Report Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            value={dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            value={dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
          />
        </div>
        
        {/* Quick Date Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quick Select
          </label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            onChange={(e) => {
              const today = new Date();
              let startDate = new Date();
              
              switch (e.target.value) {
                case 'today':
                  startDate = new Date(today.setHours(0, 0, 0, 0));
                  break;
                case 'yesterday':
                  startDate = new Date(today);
                  startDate.setDate(startDate.getDate() - 1);
                  startDate.setHours(0, 0, 0, 0);
                  break;
                case 'last7days':
                  startDate = new Date(today);
                  startDate.setDate(startDate.getDate() - 7);
                  break;
                case 'last30days':
                  startDate = new Date(today);
                  startDate.setDate(startDate.getDate() - 30);
                  break;
                case 'thisMonth':
                  startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                  break;
                case 'lastMonth':
                  startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                  setDateRange({ startDate, endDate });
                  return;
                case 'thisYear':
                  startDate = new Date(today.getFullYear(), 0, 1);
                  break;
                default:
                  return;
              }
              
              setDateRange({
                startDate,
                endDate: e.target.value === 'yesterday' ? new Date(startDate) : new Date()
              });
            }}
          >
            <option value="">Select time period</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          <select
            multiple
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-24"
            value={selectedCategories}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedCategories(options);
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Priorities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorities
          </label>
          <div className="space-y-2 mt-1">
            {priorities.map(priority => (
              <div key={priority.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`priority-${priority.id}`}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedPriorities.includes(priority.id)}
                  onChange={() => handleMultiSelectChange(setSelectedPriorities, priority.id)}
                />
                <label htmlFor={`priority-${priority.id}`} className="ml-2 text-sm text-gray-700">
                  {priority.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Statuses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statuses
          </label>
          <div className="space-y-2 mt-1">
            {statuses.map(status => (
              <div key={status.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`status-${status.id}`}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedStatuses.includes(status.id)}
                  onChange={() => handleMultiSelectChange(setSelectedStatuses, status.id)}
                />
                <label htmlFor={`status-${status.id}`} className="ml-2 text-sm text-gray-700">
                  {status.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Assignees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignees
          </label>
          <select
            multiple
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-24"
            value={selectedAssignees}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedAssignees(options);
            }}
          >
            {assignees.map(assignee => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Queues */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Queues
          </label>
          <select
            multiple
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-24"
            value={selectedQueues}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedQueues(options);
            }}
          >
            {queues.map(queue => (
              <option key={queue.id} value={queue.id}>
                {queue.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={applyFilters}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ReportFilters;
