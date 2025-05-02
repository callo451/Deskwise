import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, updateTicket } from '../../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../../services/settingsService';
import { getSLAStatusDisplay } from '../../services/slaService';
import { fetchTicketIdSettings } from '../../services/ticketSettingsService';
import { generateTicketSummary } from '../../services/aiService';
import { Ticket, TicketHistory } from '../../types/database';
import TicketComments from './TicketComments';
import { formatTicketIdWithSettings } from '../../utils/ticketIdFormatter';

interface TicketHistoryWithChanges extends TicketHistory {
  changes?: Record<string, { from?: any; to?: any } | any>;
}
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowPathIcon, SparklesIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface TicketDetailProps {
  onBack?: () => void;
}

interface TicketWithDetails extends Omit<Ticket, 'status' | 'priority'> {
  status?: string;
  priority?: string;
  status_id: string;
  priority_id: string;
  category_id: string | null;
  created_by_user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  queue: {
    id: string;
    name: string;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
  priority_details?: {
    id: string;
    name: string;
    color: string;
  };
  status_details?: {
    id: string;
    name: string;
    color: string;
  };
  category?: {
    id: string;
    name: string;
  };
  sla?: {
    id: string;
    name: string;
    response_time_minutes: number;
    resolution_time_minutes: number;
    business_hours_only: boolean;
  };
  sla_id: string | null;
  response_deadline: string | null;
  resolution_deadline: string | null;
  first_response_time: string | null;
  sla_status: string | null;
  ticket_history: TicketHistoryWithChanges[];
}

const TicketDetail: React.FC<TicketDetailProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details');
  const [formattedTicketId, setFormattedTicketId] = useState<string>('');
  
  // AI Summary state
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  // Settings state
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ticketIdSettings, setTicketIdSettings] = useState<{
    prefix: string;
    suffix: string;
    padding_length: number;
  } | null>(null);
  
  // Edit form state
  const [editedTicket, setEditedTicket] = useState<{
    title: string;
    description: string;
    status_id: string;
    priority_id: string;
    category_id: string | null;
    assigned_to: string | null;
  }>({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    category_id: null,
    assigned_to: null,
  });

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchSettings();
      if (userDetails?.tenant_id) {
        fetchTicketIdSettings(userDetails.tenant_id)
          .then(settings => {
            if (settings) {
              setTicketIdSettings({
                prefix: settings.prefix,
                suffix: settings.suffix,
                padding_length: settings.padding_length
              });
            }
          })
          .catch(err => console.error('Error fetching ticket ID settings:', err));
      }
    }
  }, [id, userDetails?.tenant_id]);
  
  const fetchSettings = async () => {
    try {
      const [prioritiesData, statusesData, categoriesData] = await Promise.all([
        getTicketPriorities(),
        getTicketStatuses(),
        getTicketCategories()
      ]);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    if (ticket) {
      setEditedTicket({
        title: ticket.title,
        description: ticket.description,
        status_id: ticket.status_id || '',
        priority_id: ticket.priority_id || '',
        category_id: ticket.category_id || null,
        assigned_to: ticket.assigned_to,
      });
      
      // Format the ticket ID if settings are available
      if (ticketIdSettings && ticket.id) {
        const formatted = formatTicketIdWithSettings(ticket.id, ticketIdSettings);
        setFormattedTicketId(formatted);
      } else {
        setFormattedTicketId(ticket.id.substring(0, 8));
      }
    }
  }, [ticket, ticketIdSettings]);

  const fetchTicket = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTicketById(id);
      setTicket(data as TicketWithDetails);
    } catch (err: any) {
      console.error('Error fetching ticket:', err);
      setError(err.message || 'Failed to fetch ticket');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateSummary = async () => {
    if (!ticket) return;
    
    setIsGeneratingSummary(true);
    setSummaryError(null);
    
    try {
      const summary = await generateTicketSummary(ticket);
      setAiSummary(summary);
      setShowAiSummary(true);
    } catch (err: any) {
      console.error('Error generating AI summary:', err);
      setSummaryError(err.message || 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedTicket = await updateTicket(id, editedTicket);
      setTicket(prev => prev ? { ...prev, ...updatedTicket } as TicketWithDetails : null);
      setIsEditing(false);
      fetchTicket(); // Refresh to get updated history
    } catch (err: any) {
      console.error('Error updating ticket:', err);
      setError(err.message || 'Failed to update ticket');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/tickets');
    }
  };

  // Check if user can edit the ticket
  const canEdit = userDetails && (
    userDetails.role === 'admin' ||
    userDetails.role === 'manager' ||
    userDetails.role === 'technician' ||
    (ticket && ticket.created_by === userDetails.id)
  );

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading ticket information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg">
        <div className="text-red-500 text-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium text-lg">{error}</p>
        </div>
        <Button className="flex items-center" onClick={fetchTicket}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">Ticket not found or has been deleted</p>
        <Button className="flex items-center" onClick={handleBack}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handleBack} className="mr-4">
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Ticket' : ticket.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Ticket #{formattedTicketId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isGeneratingSummary && !aiSummary && (
            <Button 
              onClick={handleGenerateSummary}
              className="flex items-center space-x-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>AI Summary</span>
            </Button>
          )}
          
          {!isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Ticket
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {/* AI Summary Widget - Always visible when generated */}
        {(isGeneratingSummary || aiSummary || summaryError) && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg border border-indigo-500/30 shadow-lg overflow-hidden transition-all duration-300 relative">
              {isGeneratingSummary ? (
                <div className="flex items-center justify-center space-x-2 py-2 text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                  <p>Generating AI summary...</p>
                </div>
              ) : summaryError ? (
                <div className="text-red-400 p-2">
                  <p>Error: {summaryError}</p>
                  <Button 
                    onClick={handleGenerateSummary} 
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-400 text-red-400 hover:bg-red-400/10"
                  >
                    Retry
                  </Button>
                </div>
              ) : aiSummary ? (
                <div className="text-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <SparklesIcon className="h-5 w-5 text-indigo-400 mr-2" />
                      <h4 className="font-medium text-indigo-300">AI Generated Summary</h4>
                    </div>
                    <button 
                      onClick={() => setShowAiSummary(!showAiSummary)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showAiSummary ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${showAiSummary ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                      <p className="whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={editedTicket.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={editedTicket.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status_id"
                  value={editedTicket.status_id}
                  onChange={(e) => handleEditChange('status_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a status</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="priority_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority_id"
                  value={editedTicket.priority_id}
                  onChange={(e) => handleEditChange('priority_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a priority</option>
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category_id"
                  value={editedTicket.category_id || ''}
                  onChange={(e) => handleEditChange('category_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ticket Information</h3>
              <div className="flex space-x-2">
                <button
                  className={`text-sm font-medium ${activeTab === 'details' ? 'text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button
                  className={`text-sm font-medium ${activeTab === 'history' ? 'text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
                <button
                  className={`text-sm font-medium ${activeTab === 'comments' ? 'text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
              </div>
            </div>
            
            {activeTab === 'details' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ticket ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formattedTicketId}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        {ticket.status_details ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${ticket.status_details.color}20`, // 20 is for opacity
                              color: ticket.status_details.color
                            }}>
                            {ticket.status_details.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {ticket.status || 'Unknown'}
                          </span>
                        )}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="mt-1">
                        {ticket.priority_details ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${ticket.priority_details.color}20`, // 20 is for opacity
                              color: ticket.priority_details.color
                            }}>
                            {ticket.priority_details.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {ticket.priority || 'Unknown'}
                          </span>
                        )}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Created By</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ticket.created_by_user?.first_name && ticket.created_by_user?.last_name
                          ? `${ticket.created_by_user.first_name} ${ticket.created_by_user.last_name}`
                          : ticket.created_by_user?.email}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ticket.assigned_to_user
                          ? (ticket.assigned_to_user.first_name && ticket.assigned_to_user.last_name
                            ? `${ticket.assigned_to_user.first_name} ${ticket.assigned_to_user.last_name}`
                            : ticket.assigned_to_user.email)
                          : 'Unassigned'}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Created At</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(ticket.created_at).toLocaleString()}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(ticket.updated_at).toLocaleString()}
                      </dd>
                    </div>
                    
                    {ticket.queue && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Queue</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {ticket.queue.name}
                        </dd>
                      </div>
                    )}
                    
                    {ticket.service && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Service</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {ticket.service.name}
                        </dd>
                      </div>
                    )}
                    
                    {ticket.category && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {ticket.category.name}
                        </dd>
                      </div>
                    )}
                    
                    {/* SLA Status section removed from details and moved to its own section */}
                  </dl>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">History</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {ticket.ticket_history && ticket.ticket_history.length > 0 ? (
                    <ul className="space-y-4">
                      {ticket.ticket_history.map((history: TicketHistoryWithChanges) => (
                        <li key={history.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                                {history.action.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(history.created_at).toLocaleString()}
                              </p>
                              {history.changes && Object.keys(history.changes).length > 0 && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <ul className="list-disc pl-5 space-y-1">
                                    {Object.entries(history.changes).map(([key, value]: [string, any]) => (
                                      <li key={key}>
                                        <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>:
                                        {' '}
                                        {value.from !== undefined && value.to !== undefined
                                          ? `Changed from "${value.from || 'none'}" to "${value.to || 'none'}"`
                                          : JSON.stringify(value)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No history available</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'comments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Comments</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <TicketComments ticketId={ticket.id} />
                </div>
              </div>
            )}
            
            {/* SLA Status Section */}
            {(ticket.sla_id || ticket.response_deadline || ticket.resolution_deadline) && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">SLA Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {(() => {
                    const slaStatus = getSLAStatusDisplay(
                      ticket.sla_status,
                      ticket.response_deadline,
                      ticket.resolution_deadline,
                      ticket.first_response_time
                    );
                    return (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${slaStatus.color}20`,
                              color: slaStatus.color
                            }}
                          >
                            {slaStatus.text}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ticket.response_deadline && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Response Deadline</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(ticket.response_deadline).toLocaleString()}
                                {ticket.first_response_time && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Responded: {new Date(ticket.first_response_time).toLocaleString()}
                                  </div>
                                )}
                              </dd>
                            </div>
                          )}
                          {ticket.resolution_deadline && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Resolution Deadline</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(ticket.resolution_deadline).toLocaleString()}
                              </dd>
                            </div>
                          )}
                        </div>
                        {ticket.sla && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Service Level Agreement</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {ticket.sla.name} 
                              <span className="text-xs text-gray-500 ml-2">
                                {ticket.sla.business_hours_only ? '(Business hours only)' : '(24/7)'}
                              </span>
                            </dd>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            

            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
