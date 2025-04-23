import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import TicketList from '../components/tickets/TicketList';
import TicketImport from '../components/tickets/TicketImport';
import { Button } from '../components/ui/Button';
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleCreateTicket = () => {
    navigate('/tickets/new');
  };
  
  const toggleImport = () => {
    setShowImport(prev => !prev);
  };
  
  const handleImportComplete = () => {
    // Refresh the ticket list after import
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <>
      <Helmet>
        <title>Ticket Management | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage support tickets
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={toggleImport}
              className="flex items-center"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-1" />
              {showImport ? 'Hide Import' : 'Import CSV'}
            </Button>
            <Button 
              variant="default" 
              onClick={handleCreateTicket}
              className="flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              New Ticket
            </Button>
          </div>
        </div>
        
        {showImport && (
          <TicketImport onImportComplete={handleImportComplete} />
        )}
        
        <TicketList 
          key={`ticket-list-${refreshKey}`}
          showFilters={true} 
          showPagination={true} 
        />
      </div>
    </>
  );
};

export default TicketsPage;
