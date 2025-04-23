import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTicketsByUser } from '../../services/ticketService';
import { useAuth } from '../../contexts/AuthContext';

interface TicketSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  status_details?: {
    name: string;
    color: string;
  };
  priority_details?: {
    name: string;
    color: string;
  };
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentTickets, setRecentTickets] = useState<TicketSummary[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  const fetchUserTickets = async () => {
    setIsLoading(true);
    try {
      const { tickets } = await getTicketsByUser(user!.id);
      
      // Get recent tickets (last 5)
      const recent = tickets.slice(0, 5);
      setRecentTickets(recent);
      
      // Count tickets by status
      const statusCounts: Record<string, number> = {};
      tickets.forEach((ticket: any) => {
        const statusName = ticket.status_details?.name || 'Unknown';
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      });
      setTicketsByStatus(statusCounts);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ticket Status Summary */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">My Tickets</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(ticketsByStatus).length === 0 ? (
          <p className="text-gray-500">You don't have any tickets yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(ticketsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700">{status}</span>
                <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-sm font-medium">
                  {count}
                </span>
              </div>
            ))}
            <div className="pt-2">
              <Link
                to="/tickets"
                className="text-primary hover:text-primary-dark font-medium text-sm"
              >
                View all tickets →
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Recent Tickets */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Tickets</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">You don't have any recent tickets.</p>
            <Link
              to="/tickets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Create a Ticket
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.status_details ? (
                        <span
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: `${ticket.status_details.color}20`,
                            color: ticket.status_details.color,
                          }}
                        >
                          {ticket.status_details.name}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {ticket.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.priority_details ? (
                        <span
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: `${ticket.priority_details.color}20`,
                            color: ticket.priority_details.color,
                          }}
                        >
                          {ticket.priority_details.name}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {ticket.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
