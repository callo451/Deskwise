import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { getQueue } from '../services/queueService';
import TicketList from '../components/tickets/TicketList';
import KanbanBoard from '../components/tickets/KanbanBoard';
import TicketImport from '../components/tickets/TicketImport';
import { Button } from '../components/ui/Button';
import { PlusIcon, ArrowUpTrayIcon, ViewColumnsIcon, ListBulletIcon } from '@heroicons/react/24/outline';

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { queueId } = useParams<{ queueId: string }>();
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [queueName, setQueueName] = useState<string | null>(null);
  
  const handleCreateTicket = () => {
    navigate('/tickets/new');
  };
  
  const toggleImport = () => {
    setShowImport(prev => !prev);
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'kanban' : 'list');
  };
  
  const handleImportComplete = () => {
    // Refresh the ticket list after import
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    // If we have a queueId, fetch the queue details to display the name
    if (queueId) {
      const fetchQueueDetails = async () => {
        try {
          const queueData = await getQueue(queueId);
          setQueueName(queueData.name);
        } catch (error) {
          console.error('Error fetching queue details:', error);
        }
      };
      
      fetchQueueDetails();
    } else {
      setQueueName(null);
    }
    
    // Force refresh of ticket data when queue changes
    setRefreshKey(prev => prev + 1);
  }, [queueId]);
  
  return (
    <>
      <Helmet>
        <title>Ticket Management | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {queueId ? `Queue: ${queueName || 'Loading...'} - Tickets` : 'Ticket Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {queueId ? `Viewing tickets in the ${queueName || 'selected'} queue` : 'Create and manage support tickets'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={toggleViewMode}
              className="flex items-center"
              title={viewMode === 'list' ? 'Switch to Kanban View' : 'Switch to List View'}
            >
              {viewMode === 'list' ? (
                <>
                  <ViewColumnsIcon className="h-5 w-5 mr-1" />
                  Kanban View
                </>
              ) : (
                <>
                  <ListBulletIcon className="h-5 w-5 mr-1" />
                  List View
                </>
              )}
            </Button>
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
        
        {viewMode === 'list' ? (
          <TicketList 
            key={`ticket-list-${refreshKey}-${queueId || 'all'}`}
            showFilters={true} 
            showPagination={true} 
            initialFilters={queueId ? { queue_id: queueId } : undefined}
          />
        ) : (
          <KanbanBoard 
            key={`kanban-board-${refreshKey}-${queueId || 'all'}`}
            showFilters={false}
            refreshKey={refreshKey}
            initialFilters={queueId ? { queue_id: queueId } : undefined}
          />
        )}
      </div>
    </>
  );
};

export default TicketsPage;
