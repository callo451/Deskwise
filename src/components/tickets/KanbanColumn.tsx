import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from '../tickets/KanbanCard';
import { Ticket } from '../../types/database';

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

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tickets: TicketWithDetails[];
  ticketIdSettings: {
    prefix: string;
    suffix: string;
    padding_length: number;
  } | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  id, 
  title, 
  color,
  tickets,
  ticketIdSettings
}) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      statusId: id
    }
  });

  const ticketIds = tickets.map(ticket => ticket.id);

  return (
    <div 
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
    >
      <div 
        className="p-3 font-medium text-sm border-b" 
        style={{ 
          backgroundColor: `${color}10`, 
          borderColor: `${color}30`,
          color: color
        }}
      >
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <span className="bg-white text-gray-600 rounded-full px-2 py-0.5 text-xs">
            {tickets.length}
          </span>
        </div>
      </div>
      
      <div className="p-2 h-[calc(100vh-250px)] overflow-y-auto">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm italic">
              No tickets in this status
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(ticket => (
                <KanbanCard 
                  key={ticket.id} 
                  ticket={ticket}
                  ticketIdSettings={ticketIdSettings}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
