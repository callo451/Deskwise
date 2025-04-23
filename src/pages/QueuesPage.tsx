import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueues, QueueItem } from '../services/queueService';
import { Button } from '../components/ui/Button';
import { QueueListIcon, PlusIcon } from '@heroicons/react/24/outline';

const QueuesPage: React.FC = () => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getQueues();
      // Only show active queues
      setQueues(data.filter(queue => queue.is_active));
    } catch (err: any) {
      console.error('Error fetching queues:', err);
      setError(err.message || 'Failed to fetch queues');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading queues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg shadow">
        <div className="text-red-500 text-center mb-4">
          <p className="font-medium text-lg mt-2">{error}</p>
        </div>
        <Button className="flex items-center" onClick={fetchQueues}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Queues</h1>
        <Link to="/settings/tickets">
          <Button variant="outline" className="flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Manage Queues
          </Button>
        </Link>
      </div>

      {queues.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <QueueListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Queues Available</h2>
          <p className="text-gray-600 mb-6">
            There are no active queues in the system. Create a queue to organize your tickets.
          </p>
          <Link to="/settings/tickets">
            <Button>
              Create Your First Queue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map(queue => (
            <Link 
              key={queue.id} 
              to={`/queues/${queue.id}`}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <QueueListIcon className="h-8 w-8 text-primary mr-4 mt-1" />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{queue.name}</h2>
                    {queue.description && (
                      <p className="text-gray-600 mt-1 text-sm">{queue.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueuesPage;
