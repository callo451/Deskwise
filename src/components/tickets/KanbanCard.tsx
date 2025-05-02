import React from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { Ticket } from '../../types/database';
import { formatTicketIdWithSettings } from '../../utils/ticketIdFormatter';
import { UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TicketWithDetails extends Ticket {
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
  assigned_to_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  numeric_id?: number;
}

interface KanbanCardProps {
  ticket: TicketWithDetails;
  ticketIdSettings: {
    prefix: string;
    suffix: string;
    padding_length: number;
  } | null;
  isOverlay?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ 
  ticket, 
  ticketIdSettings,
  isOverlay = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: ticket.id,
    data: {
      type: 'card',
      ticket
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const cardClasses = `
    bg-white rounded-md shadow-sm border border-gray-200 p-3
    hover:shadow-md transition-shadow duration-200
    ${isOverlay ? 'shadow-lg' : ''}
    ${isDragging ? 'opacity-50' : 'opacity-100'}
  `;

  const getInitials = (user: { first_name: string | null; last_name: string | null }) => {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cardClasses}
    >
      <div className="flex justify-between items-start mb-2">
        <Link 
          to={`/tickets/${ticket.id}`}
          className="text-xs font-mono text-blue-600 hover:text-blue-800"
        >
          {ticketIdSettings
            ? formatTicketIdWithSettings(ticket.id, ticketIdSettings)
            : ticket.id.substring(0, 8)}
        </Link>
        
        {ticket.priority_details && (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" 
            style={{
              backgroundColor: `${ticket.priority_details.color}20`,
              color: ticket.priority_details.color
            }}
          >
            {ticket.priority_details.name}
          </span>
        )}
      </div>
      
      <Link 
        to={`/tickets/${ticket.id}`}
        className="block mb-2"
      >
        <h3 className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2">
          {ticket.title}
        </h3>
      </Link>
      
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {ticket.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {ticket.assigned_to_user ? (
            <div className="flex items-center">
              <div 
                className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium"
                title={`${ticket.assigned_to_user.first_name || ''} ${ticket.assigned_to_user.last_name || ''}`.trim()}
              >
                {getInitials(ticket.assigned_to_user)}
              </div>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <UserCircleIcon className="w-4 h-4 mr-1" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center" title={new Date(ticket.created_at).toLocaleString()}>
          <ClockIcon className="w-3 h-3 mr-1" />
          <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      
      {ticket.category && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          {ticket.category.name}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
