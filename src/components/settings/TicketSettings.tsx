import React, { useState } from 'react';
import TicketPrioritiesSettings from './TicketPrioritiesSettings';
import TicketCategoriesSettings from './TicketCategoriesSettings';
import TicketStatusesSettings from './TicketStatusesSettings';
import SLASettings from './SLASettings';
import TicketIdFormatSettings from './TicketIdFormatSettings';
import QueueSettings from './QueueSettings';
import { Button } from '../ui/Button';

const TicketSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'priorities' | 'categories' | 'statuses' | 'slas' | 'id_format' | 'queues'>('priorities');
  
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Ticket Settings</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('priorities')}
              className={`${
                activeTab === 'priorities'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Priorities
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('statuses')}
              className={`${
                activeTab === 'statuses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Statuses
            </button>
            <button
              onClick={() => setActiveTab('slas')}
              className={`${
                activeTab === 'slas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              SLAs
            </button>
            <button
              onClick={() => setActiveTab('id_format')}
              className={`${
                activeTab === 'id_format'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Ticket ID Format
            </button>
            <button
              onClick={() => setActiveTab('queues')}
              className={`${
                activeTab === 'queues'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              Queues
            </button>
          </nav>
        </div>
      </div>
      
      <div className="mt-6">
        {activeTab === 'priorities' && <TicketPrioritiesSettings />}
        {activeTab === 'categories' && <TicketCategoriesSettings />}
        {activeTab === 'statuses' && <TicketStatusesSettings />}
        {activeTab === 'slas' && <SLASettings />}
        {activeTab === 'id_format' && <TicketIdFormatSettings />}
        {activeTab === 'queues' && <QueueSettings />}
      </div>
    </div>
  );
};

export default TicketSettings;
