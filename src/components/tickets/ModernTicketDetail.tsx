import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, updateTicket } from '../../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../../services/settingsService';
import { getSLAStatusDisplay } from '../../services/slaService';

import { generateTicketSummary } from '../../services/aiService';
import { fetchUsers } from '../../services/userService';
import { getQueues } from '../../services/queueService';
import { Ticket, TicketHistory } from '../../types/database';
import TicketComments from './TicketComments';
import TicketKnowledgeBase from '../knowledge/TicketKnowledgeBase';
import { Button } from '../ui/Button';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ClockIcon, 
  UserIcon, 
  TagIcon, 
  FolderIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface TicketHistoryWithChanges extends TicketHistory {
  changes?: Record<string, { from?: any; to?: any } | any>;
}

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

const ModernTicketDetail: React.FC<TicketDetailProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments' | 'knowledge'>('details');
  
  // AI Summary state
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  

  
  // Settings state
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  
  // Edit form state
  const [editedTicket, setEditedTicket] = useState<{
    title: string;
    description: string;
    status_id: string;
    priority_id: string;
    category_id: string | null;
    assigned_to: string | null;
    queue_id: string | null;
  }>({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    category_id: null,
    assigned_to: null,
    queue_id: null,
  });

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchSettings();
    }
  }, [id]);
  
  const fetchSettings = async () => {
    try {
      const [prioritiesData, statusesData, categoriesData, queuesData] = await Promise.all([
        getTicketPriorities(),
        getTicketStatuses(),
        getTicketCategories(),
        getQueues()
      ]);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setCategories(categoriesData);
      // Only show active queues
      setQueues(queuesData.filter(queue => queue.is_active));
      
      // Fetch users for assignment dropdown
      if (userDetails?.tenant_id) {
        const usersData = await fetchUsers(userDetails.tenant_id);
        // Filter to only show active users that can be assigned tickets (technicians, managers, admins)
        const assignableUsers = usersData.filter(user => 
          user.is_active && ['technician', 'manager', 'admin'].includes(user.role)
        );
        setUsers(assignableUsers);
      }
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
        queue_id: ticket.queue_id || null,
      });
    }
  }, [ticket]);

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
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading ticket information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg shadow">
        <div className="text-red-500 text-center mb-4">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto" />
          <p className="font-medium text-lg mt-2">{error}</p>
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
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg shadow">
        <InformationCircleIcon className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-600 mb-4">Ticket not found or has been deleted</p>
        <Button className="flex items-center" onClick={handleBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  // Get SLA status display
  const slaStatus = ticket.sla_id || ticket.response_deadline || ticket.resolution_deadline 
    ? getSLAStatusDisplay(
        ticket.sla_status,
        ticket.response_deadline,
        ticket.resolution_deadline,
        ticket.first_response_time
      )
    : null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with ticket number and actions */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack} 
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  #{ticket.id.substring(0, 8)}
                </h1>
                {ticket.status_details && (
                  <span 
                    className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${ticket.status_details.color}20`,
                      color: ticket.status_details.color
                    }}
                  >
                    {ticket.status_details.name}
                  </span>
                )}
                {ticket.priority_details && (
                  <span 
                    className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${ticket.priority_details.color}20`,
                      color: ticket.priority_details.color
                    }}
                  >
                    {ticket.priority_details.name}
                  </span>
                )}
              </div>
              <h2 className="text-lg text-gray-700 mt-1">{ticket.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isGeneratingSummary && !aiSummary && (
              <Button 
                onClick={handleGenerateSummary}
                className="flex items-center space-x-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 mr-2"
                size="sm"
              >
                <SparklesIcon className="h-4 w-4 mr-1" />
                AI Summary
              </Button>
            )}
            
            {!isEditing && canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="px-6 border-t border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'knowledge' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('knowledge')}
            >
              Knowledge Base
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="p-6">
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
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                      <ReactMarkdown>
                        {aiSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Ticket</h3>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  value={editedTicket.assigned_to || ''}
                  onChange={(e) => handleEditChange('assigned_to', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="queue_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Queue
                </label>
                <select
                  id="queue_id"
                  value={editedTicket.queue_id || ''}
                  onChange={(e) => handleEditChange('queue_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">No Queue</option>
                  {queues.map(queue => (
                    <option key={queue.id} value={queue.id}>
                      {queue.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)} 
                disabled={isSaving}
                className="flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Main ticket info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Description</h3>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                  </div>
                  
                  {/* SLA Information */}
                  {slaStatus && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-4">
                        <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">SLA Information</h3>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-col space-y-4">
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
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right column - Metadata */}
                <div className="space-y-6">
                  {/* Ticket Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
                    </div>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created By</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {ticket.created_by_user?.first_name && ticket.created_by_user?.last_name
                            ? `${ticket.created_by_user.first_name} ${ticket.created_by_user.last_name}`
                            : ticket.created_by_user?.email}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {ticket.assigned_to_user
                            ? (ticket.assigned_to_user.first_name && ticket.assigned_to_user.last_name
                              ? `${ticket.assigned_to_user.first_name} ${ticket.assigned_to_user.last_name}`
                              : ticket.assigned_to_user.email)
                            : 'Unassigned'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(ticket.created_at).toLocaleString()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(ticket.updated_at).toLocaleString()}
                        </dd>
                      </div>
                      
                      {ticket.queue && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Queue</dt>
                          <dd className="mt-1 text-sm text-gray-900 flex items-center">
                            <FolderIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {ticket.queue.name}
                          </dd>
                        </div>
                      )}
                      
                      {ticket.service && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Service</dt>
                          <dd className="mt-1 text-sm text-gray-900 flex items-center">
                            <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {ticket.service.name}
                          </dd>
                        </div>
                      )}
                      
                      {ticket.category && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Category</dt>
                          <dd className="mt-1 text-sm text-gray-900 flex items-center">
                            <FolderIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {ticket.category.name}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Ticket History</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  {ticket.ticket_history && ticket.ticket_history.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {ticket.ticket_history.map((history: TicketHistoryWithChanges, historyIdx) => (
                          <li key={history.id}>
                            <div className="relative pb-8">
                              {historyIdx !== ticket.ticket_history.length - 1 ? (
                                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex items-start space-x-3">
                                <div className="relative">
                                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center ring-8 ring-white">
                                    {history.action.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1 py-1.5">
                                  <div className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">
                                      {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                                    </span>
                                    <span className="ml-2 text-xs">
                                      {new Date(history.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  {history.changes && Object.keys(history.changes).length > 0 && (
                                    <div className="mt-2 text-sm text-gray-700">
                                      <ul className="list-disc pl-5 space-y-1">
                                        {Object.entries(history.changes).map(([key, value]: [string, any]) => (
                                          <li key={key}>
                                            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>:
                                            {' '}
                                            {value.from !== undefined && value.to !== undefined
                                              ? <span>Changed from <span className="text-red-500">"{value.from || 'none'}"</span> to <span className="text-green-500">"{value.to || 'none'}"</span></span>
                                              : JSON.stringify(value)}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No history available</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'comments' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  {activeTab === 'comments' && ticket && (
                    <TicketComments ticketId={ticket.id} />
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'knowledge' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <BookOpenIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Knowledge Base</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  {activeTab === 'knowledge' && ticket && (
                    <TicketKnowledgeBase ticketId={ticket.id} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernTicketDetail;
