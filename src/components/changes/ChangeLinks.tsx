import React, { useState, useEffect } from 'react';
import { Change } from '../../types/database';
import { Button } from '../ui/Button';
import { 
  PlusIcon, 
  TrashIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { 
  getChangeTicketLinks, 
  getChangeProblemLinks,
  linkChangeToTicket,
  linkProblemToChange,
  unlinkTicketFromChange,
  unlinkProblemFromChange
} from '../../services/changeService';
import { getTicket } from '../../services/ticketService';
import { getProblem } from '../../services/problemService';
import { useAuth } from '../../contexts/AuthContext';

interface ChangeLinksProps {
  change: Change;
  onRefresh: () => void;
}

interface LinkedTicket {
  id: string;
  ticket_id: string;
  change_id: string;
  created_at: string;
  ticket_title?: string;
  ticket_status?: string;
}

interface LinkedProblem {
  id: string;
  problem_id: string;
  change_id: string;
  created_at: string;
  problem_title?: string;
  problem_status?: string;
}

const ChangeLinks: React.FC<ChangeLinksProps> = ({
  change,
  onRefresh
}) => {
  const { userDetails } = useAuth();
  const [ticketLinks, setTicketLinks] = useState<LinkedTicket[]>([]);
  const [problemLinks, setProblemLinks] = useState<LinkedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Link form state
  const [linkType, setLinkType] = useState<'ticket' | 'problem'>('ticket');
  const [linkId, setLinkId] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  
  // Check if user can add/remove links
  const canManageLinks = userDetails?.role === 'admin' || 
                         userDetails?.role === 'manager' || 
                         (userDetails?.role === 'technician' && 
                          change.assigned_to === userDetails?.id);
  
  useEffect(() => {
    fetchLinks();
  }, [change.id]);
  
  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ticket and problem links
      const [ticketLinksData, problemLinksData] = await Promise.all([
        getChangeTicketLinks(change.id),
        getChangeProblemLinks(change.id)
      ]);
      
      // Fetch additional details for tickets
      const ticketsWithDetails = await Promise.all(
        ticketLinksData.map(async (link) => {
          try {
            const ticket = await getTicket(link.ticket_id);
            return {
              ...link,
              ticket_title: ticket.title,
              ticket_status: ticket.status
            };
          } catch (err) {
            console.error(`Error fetching ticket ${link.ticket_id}:`, err);
            return link;
          }
        })
      );
      
      // Fetch additional details for problems
      const problemsWithDetails = await Promise.all(
        problemLinksData.map(async (link) => {
          try {
            const problem = await getProblem(link.problem_id);
            return {
              ...link,
              problem_title: problem.title,
              problem_status: problem.status
            };
          } catch (err) {
            console.error(`Error fetching problem ${link.problem_id}:`, err);
            return link;
          }
        })
      );
      
      setTicketLinks(ticketsWithDetails);
      setProblemLinks(problemsWithDetails);
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError(err.message || 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkId.trim()) {
      setError('Please enter a valid ID');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (linkType === 'ticket') {
        // Check if already linked
        if (ticketLinks.some(link => link.ticket_id === linkId)) {
          throw new Error('This ticket is already linked to this change');
        }
        
        await linkChangeToTicket(change.id, linkId, userDetails?.id || '');
      } else {
        // Check if already linked
        if (problemLinks.some(link => link.problem_id === linkId)) {
          throw new Error('This problem is already linked to this change');
        }
        
        await linkProblemToChange(change.id, linkId, userDetails?.id || '');
      }
      
      // Reset form and refresh links
      setLinkId('');
      setShowLinkForm(false);
      await fetchLinks();
      onRefresh();
    } catch (err: any) {
      console.error('Error adding link:', err);
      setError(err.message || `Failed to link ${linkType}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveTicketLink = async (linkId: string) => {
    try {
      setIsSubmitting(true);
      
      await unlinkTicketFromChange(change.id, linkId);
      
      // Refresh links
      await fetchLinks();
      onRefresh();
    } catch (err: any) {
      console.error('Error removing ticket link:', err);
      setError(err.message || 'Failed to remove ticket link');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveProblemLink = async (linkId: string) => {
    try {
      setIsSubmitting(true);
      
      await unlinkProblemFromChange(change.id, linkId);
      
      // Refresh links
      await fetchLinks();
      onRefresh();
    } catch (err: any) {
      console.error('Error removing problem link:', err);
      setError(err.message || 'Failed to remove problem link');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge color for tickets
  const getTicketStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge color for problems
  const getProblemStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'identified':
        return 'bg-blue-100 text-blue-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'known_error':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Add Link Form */}
      {canManageLinks && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Add Link</h3>
            {!showLinkForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinkForm(true)}
                className="flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            )}
          </div>
          {showLinkForm && (
            <div className="p-6">
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label htmlFor="link_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Link Type
                  </label>
                  <select
                    id="link_type"
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as 'ticket' | 'problem')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="ticket">Ticket</option>
                    <option value="problem">Problem</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="link_id" className="block text-sm font-medium text-gray-700 mb-1">
                    {linkType === 'ticket' ? 'Ticket ID' : 'Problem ID'}
                  </label>
                  <input
                    id="link_id"
                    type="text"
                    value={linkId}
                    onChange={(e) => setLinkId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder={`Enter ${linkType} ID`}
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Link'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLinkForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      
      {/* Linked Tickets */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Linked Tickets</h3>
        </div>
        <div className="p-6">
          {ticketLinks.length === 0 ? (
            <p className="text-gray-500">No tickets are linked to this change.</p>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {canManageLinks && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticketLinks.map(link => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.ticket_id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {link.ticket_title || 'Unknown Ticket'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.ticket_status && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getTicketStatusBadgeColor(link.ticket_status).split(' ')[0],
                              color: getTicketStatusBadgeColor(link.ticket_status).split(' ')[1]
                            }}
                          >
                            {link.ticket_status.charAt(0).toUpperCase() + link.ticket_status.slice(1).replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      {canManageLinks && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveTicketLink(link.id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Linked Problems */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Linked Problems</h3>
        </div>
        <div className="p-6">
          {problemLinks.length === 0 ? (
            <p className="text-gray-500">No problems are linked to this change.</p>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problem ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {canManageLinks && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {problemLinks.map(link => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.problem_id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {link.problem_title || 'Unknown Problem'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.problem_status && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getProblemStatusBadgeColor(link.problem_status).split(' ')[0],
                              color: getProblemStatusBadgeColor(link.problem_status).split(' ')[1]
                            }}
                          >
                            {link.problem_status.charAt(0).toUpperCase() + link.problem_status.slice(1).replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      {canManageLinks && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveProblemLink(link.id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeLinks;
