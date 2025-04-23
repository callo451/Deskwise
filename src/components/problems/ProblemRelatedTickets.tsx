import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Problem } from '../../types/database';
import { getTickets } from '../../services/ticketService';
import { linkTicketToProblem, unlinkTicketFromProblem } from '../../services/problemService';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface ProblemRelatedTicketsProps {
  problem: Problem & {
    related_tickets?: {
      ticket_id: string;
      tickets?: {
        id: string;
        title: string;
        status: string;
        priority: string;
        created_at: string;
      };
    }[];
  };
  onTicketsChanged: () => void;
}

const ProblemRelatedTickets: React.FC<ProblemRelatedTicketsProps> = ({
  problem,
  onTicketsChanged
}) => {
  const { userDetails } = useAuth();
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relatedTickets = problem.related_tickets?.filter(link => link.tickets) || [];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const { tickets } = await getTickets({
        limit: 10,
      });
      
      // Filter tickets by search query and exclude already linked tickets
      const linkedTicketIds = relatedTickets.map(link => link.ticket_id);
      const filteredResults = tickets.filter(ticket => 
        (ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         ticket.id.includes(searchQuery)) &&
        !linkedTicketIds.includes(ticket.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err: any) {
      console.error('Error searching tickets:', err);
      setError(err.message || 'Failed to search tickets');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkTicket = async (ticketId: string) => {
    if (!userDetails?.id) return;
    
    try {
      await linkTicketToProblem(problem.id, ticketId, userDetails.id);
      setSearchResults(prev => prev.filter(ticket => ticket.id !== ticketId));
      onTicketsChanged();
    } catch (err: any) {
      console.error('Error linking ticket:', err);
      setError(err.message || 'Failed to link ticket');
    }
  };

  const handleUnlinkTicket = async (ticketId: string) => {
    try {
      await unlinkTicketFromProblem(problem.id, ticketId);
      onTicketsChanged();
    } catch (err: any) {
      console.error('Error unlinking ticket:', err);
      setError(err.message || 'Failed to unlink ticket');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Related Tickets</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAddingTicket(!isAddingTicket)}
          className="flex items-center"
        >
          {isAddingTicket ? (
            <>
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-1" />
              Link Ticket
            </>
          )}
        </Button>
      </div>

      {isAddingTicket && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Link Existing Ticket</h4>
          
          <div className="flex space-x-2 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket ID or title"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center"
            >
              {isSearching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}

          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {ticket.id.substring(0, 8)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ticket.title}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={() => handleLinkTicket(ticket.id)}
                          className="flex items-center"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Link
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-sm text-gray-500 text-center py-2">
              No matching tickets found
            </div>
          ) : null}
        </div>
      )}

      {relatedTickets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {relatedTickets.map((link) => (
                <tr key={link.ticket_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.ticket_id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/tickets/${link.ticket_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {link.tickets?.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {link.tickets?.status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(link.tickets.status)}`}>
                        {link.tickets.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {link.tickets?.priority && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(link.tickets.priority)}`}>
                        {link.tickets.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.tickets?.created_at && formatDistanceToNow(new Date(link.tickets.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleUnlinkTicket(link.ticket_id)}
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      Unlink
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-gray-500 text-sm">No tickets are linked to this problem.</p>
        </div>
      )}
    </div>
  );
};

export default ProblemRelatedTickets;
