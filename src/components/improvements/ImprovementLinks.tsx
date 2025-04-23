import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  LinkIcon, 
  PlusIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { 
  Improvement, 
  Ticket 
} from '../../types/database';
import { 
  linkTicketToImprovement, 
  unlinkTicketFromImprovement 
} from '../../services/improvementService';
import { getTickets } from '../../services/ticketService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getButtonColorClass } from '../ui/ButtonVariants';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';

interface ImprovementLinksProps {
  improvement: Improvement;
  onRefresh: () => void;
}

const ImprovementLinks: React.FC<ImprovementLinksProps> = ({ 
  improvement, 
  onRefresh 
}) => {
  const { userDetails } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  
  // Handle the case where related_tickets might not be in the type definition
  const relatedTickets = (improvement as any).related_tickets || [];
  
  // Check if user can link/unlink tickets
  const canManageLinks = userDetails?.role === 'admin' || 
                        userDetails?.role === 'manager' || 
                        (userDetails?.role === 'technician' && 
                         improvement?.assigned_to === userDetails?.id);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Use a more generic search approach that works with the ticketService
      const { tickets } = await getTickets({
        limit: 5
      });
      
      // Filter out tickets that are already linked
      const linkedTicketIds = relatedTickets.map(link => link.ticket_id);
      const filteredResults = tickets.filter(ticket => !linkedTicketIds.includes(ticket.id));
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching tickets:', err);
      setError('Failed to search tickets');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleLinkTicket = async (ticketId: string) => {
    if (!improvement.id || !userDetails?.id) return;
    
    try {
      setError(null);
      
      await linkTicketToImprovement(improvement.id, ticketId, userDetails.id);
      
      // Clear search results and query
      setSearchResults([]);
      setSearchQuery('');
      setIsLinking(false);
      
      // Refresh improvement data to show the new link
      onRefresh();
    } catch (err) {
      console.error('Error linking ticket:', err);
      setError('Failed to link ticket');
    }
  };
  
  const handleUnlinkTicket = async (ticketId: string) => {
    if (!improvement.id) return;
    
    try {
      setIsUnlinking(ticketId);
      setError(null);
      
      await unlinkTicketFromImprovement(improvement.id, ticketId);
      
      // Refresh improvement data to update the links
      onRefresh();
    } catch (err) {
      console.error('Error unlinking ticket:', err);
      setError('Failed to unlink ticket');
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
    <div>
      {error && <ErrorDisplay message={error} className="mb-4" />}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Related Tickets</h3>
        
        {canManageLinks && !isLinking && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLinking(true)}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Link Ticket
          </Button>
        )}
      </div>
      
      {isLinking && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by ID or title"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={getButtonColorClass('primary')}
              >
                {isSearching ? <LoadingSpinner size="sm" className="mr-1" /> : <LinkIcon className="h-4 w-4 mr-1" />}
                Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLinking(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results</h4>
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {searchResults.map(ticket => (
                  <li key={ticket.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-500">ID: {ticket.id} • Status: {ticket.status}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkTicket(ticket.id)}
                      className="flex items-center text-xs py-1 px-2"
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Link
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {searchResults.length === 0 && searchQuery && !isSearching && (
            <p className="mt-2 text-sm text-gray-500">No matching tickets found</p>
          )}
        </div>
      )}
      
      {relatedTickets.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <LinkIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No linked tickets</h3>
          <p className="mt-1 text-sm text-gray-500">
            Link tickets to this improvement to track related work.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Ticket
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Priority
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created
                </th>
                {canManageLinks && (
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {relatedTickets.map((link: any) => {
                const ticket = link.tickets;
                if (!ticket) return null;
                
                return (
                  <tr key={link.ticket_id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-900">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </td>
                    {canManageLinks && (
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlinkTicket(ticket.id)}
                          disabled={isUnlinking === ticket.id}
                          className="text-red-600 hover:text-red-900 flex items-center text-xs py-1 px-2"
                        >
                          {isUnlinking === ticket.id ? (
                            <LoadingSpinner size="sm" className="mr-1" />
                          ) : (
                            <XMarkIcon className="h-3 w-3 mr-1" />
                          )}
                          Unlink
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImprovementLinks;
