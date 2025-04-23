import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQueue } from '../services/queueService';
import TicketList from '../components/tickets/TicketList';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon, QueueListIcon } from '@heroicons/react/24/outline';

const QueuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [queue, setQueue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchQueue(id);
    }
  }, [id]);

  const fetchQueue = async (queueId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queueData = await getQueue(queueId);
      setQueue(queueData);
    } catch (err: any) {
      console.error('Error fetching queue:', err);
      setError(err.message || 'Failed to fetch queue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading queue information...</p>
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg shadow">
        <div className="text-red-500 text-center mb-4">
          <p className="font-medium text-lg mt-2">{error || 'Queue not found'}</p>
        </div>
        <Link to="/queues">
          <Button className="flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Queues
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/queues" className="mr-4">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <QueueListIcon className="h-6 w-6 mr-2 text-primary" />
              {queue.name}
            </h1>
            {queue.description && (
              <p className="text-gray-600 mt-1">{queue.description}</p>
            )}
          </div>
        </div>
        <Link to="/tickets/new">
          <Button>Create Ticket</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <TicketList 
          initialFilters={{ queue_id: id }}
          showFilters={true}
          showPagination={true}
        />
      </div>
    </div>
  );
};

export default QueuePage;
