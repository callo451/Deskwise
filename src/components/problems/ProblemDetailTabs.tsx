import React from 'react';

interface ProblemDetailTabsProps {
  activeTab: 'details' | 'history' | 'tickets' | 'workaround' | 'solution';
  onTabChange: (tab: 'details' | 'history' | 'tickets' | 'workaround' | 'solution') => void;
}

const ProblemDetailTabs: React.FC<ProblemDetailTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="px-6 border-t border-gray-200">
      <nav className="-mb-px flex space-x-6">
        <button
          onClick={() => onTabChange('details')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => onTabChange('workaround')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'workaround'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Workaround
        </button>
        <button
          onClick={() => onTabChange('solution')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'solution'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Solution
        </button>
        <button
          onClick={() => onTabChange('tickets')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'tickets'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Related Tickets
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          History
        </button>
      </nav>
    </div>
  );
};

export default ProblemDetailTabs;
