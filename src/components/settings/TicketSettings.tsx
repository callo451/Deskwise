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
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'priorities'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('priorities')}
            >
              Priorities
            </Button>
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </Button>
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'statuses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('statuses')}
            >
              Statuses
            </Button>
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'slas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('slas')}
            >
              SLAs
            </Button>
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'id_format'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('id_format')}
            >
              Ticket ID Format
            </Button>
            <Button
              variant="ghost"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'queues'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('queues')}
            >
              Queues
            </Button>
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
