import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay,
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { getTickets } from '../../services/ticketService';
import { getTicketStatuses } from '../../services/settingsService';
import { updateTicket } from '../../services/ticketService';
import { Ticket } from '../../types/database';
import KanbanColumn from '../tickets/KanbanColumn';
import KanbanCard from '../tickets/KanbanCard';
import toast from 'react-hot-toast';

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

interface KanbanBoardProps {
  showFilters?: boolean;
  initialFilters?: {
    priority_id?: string | string[];
    category_id?: string | string[];
    assigned_to?: string;
    created_by?: string;
    queue_id?: string;
    service_id?: string;
  };
  refreshKey?: number;
}

interface TicketStatus {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_closed: boolean;
}

interface TicketsByStatus {
  [statusId: string]: TicketWithDetails[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialFilters = {},
  refreshKey = 0,
}) => {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<TicketsByStatus>({});
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketWithDetails | null>(null);
  const [ticketIdSettings] = useState<{
    prefix: string;
    suffix: string;
    padding_length: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchStatuses();
    fetchTickets();
  }, [refreshKey]);

  useEffect(() => {
    if (tickets.length && statuses.length) {
      organizeTicketsByStatus();
    }
  }, [tickets, statuses]);

  const fetchStatuses = async () => {
    try {
      const statusesData = await getTicketStatuses();
      setStatuses(statusesData);
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setError('Failed to load ticket statuses');
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { tickets: fetchedTickets } = await getTickets({
        ...initialFilters,
        limit: 100, // Increased limit for Kanban view
      });
      
      setTickets(fetchedTickets as TicketWithDetails[]);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const organizeTicketsByStatus = () => {
    const ticketMap: TicketsByStatus = {};
    
    // Initialize with empty arrays for all statuses
    statuses.forEach(status => {
      ticketMap[status.id] = [];
    });
    
    // Populate with tickets
    tickets.forEach(ticket => {
      if (ticket.status_id && ticketMap[ticket.status_id]) {
        ticketMap[ticket.status_id].push(ticket);
      }
    });
    
    // Sort tickets within each status if needed, e.g., by creation date
    Object.keys(ticketMap).forEach(statusId => {
       ticketMap[statusId].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    
    setTicketsByStatus(ticketMap);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveTicket(active.data.current.ticket as TicketWithDetails);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null); // Reset overlay immediately

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return; // Dropped in the same place

    const activeIsCard = active.data.current?.type === 'card';
    const overIsColumn = over.data.current?.type === 'column';
    const overIsCard = over.data.current?.type === 'card';

    if (!activeIsCard) return; // We should only be dragging cards

    let newStatusId: string | null = null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (overIsColumn) {
      // Dropped directly onto a column: Prioritize data, fallback to ID
      const statusIdInData = over.data.current?.statusId as string;
      if (statusIdInData && uuidRegex.test(statusIdInData)) {
        newStatusId = statusIdInData;
      } else if (uuidRegex.test(overId)) {
        newStatusId = overId;
      }
    } else if (overIsCard) {
      // Dropped onto another card: Prioritize containerId, fallback to state lookup
      const containerId = over.data.current?.sortable?.containerId as string;
      if (containerId && uuidRegex.test(containerId)) {
        newStatusId = containerId; // Prefer containerId if it's a valid UUID
      } else {
        // Fallback: Find status from ticketsByStatus if containerId is invalid/missing
        console.warn(`containerId '${containerId}' is not a valid UUID when dropping on card '${overId}'. Falling back to ticketsByStatus lookup.`);
        for (const statusId in ticketsByStatus) {
          // Ensure the statusId key itself is a valid UUID before using it
          if (uuidRegex.test(statusId) && ticketsByStatus[statusId].some(ticket => ticket.id === overId)) {
            newStatusId = statusId;
            console.log(`Fallback successful: Found statusId '${newStatusId}' for card '${overId}' in ticketsByStatus.`);
            break;
          }
        }
      }
    }

    console.log(`[Debug] Before final validation: activeId=${activeId}, overId=${overId}, determined newStatusId=${newStatusId}`);
    
    // FINAL VALIDATION: Ensure we found a valid UUID after all checks
    if (!newStatusId) { 
      console.error(`Could not determine a valid target status UUID. activeId=${activeId}, overId=${overId}. Over object:`, over);
      // Log specific potentially problematic properties from 'over' object
      console.log(`[Debug] Failure details: over.id = ${over.id}`);
      console.log(`[Debug] Failure details: over.data.current?.statusId = ${over.data.current?.statusId}`);
      console.log(`[Debug] Failure details: over.data.current?.sortable?.containerId = ${over.data.current?.sortable?.containerId}`);
      toast.error("Failed to update ticket: Invalid drop target.");
      return;
    }

    const draggedTicket = tickets.find(ticket => ticket.id === activeId);
    const originalStatusId = draggedTicket?.status_id;

    if (draggedTicket && originalStatusId !== newStatusId) {
      try {
        // --- Optimistic Update ---
        const updatedTickets = tickets.map(ticket =>
          ticket.id === activeId
            ? { ...ticket, status_id: newStatusId! }
            : ticket
        );
        setTickets(updatedTickets);
        organizeTicketsByStatus(); // Re-render board with new structure
        // -------------------------

        // Update in the database
        await updateTicket(activeId, { status_id: newStatusId });

        // Show success notification
        toast.success('Ticket status updated successfully');
        // Potentially fetch fresh data if optimistic update isn't fully trusted
        // fetchTickets();

      } catch (error: any) {
        console.error('Error updating ticket status:', error);
        toast.error(`Failed to update ticket: ${error.message || 'Unknown error'}`);

        // --- Revert Optimistic Update ---
        if (originalStatusId) {
          const revertedTickets = tickets.map(ticket =>
            ticket.id === activeId
              ? { ...ticket, status_id: originalStatusId } // Revert to original
              : ticket
          );
          setTickets(revertedTickets);
          organizeTicketsByStatus(); // Re-render board again
        } else {
          // If original status wasn't found, fetch fresh data as fallback
          fetchTickets();
        }
        // -----------------------------
      }
    } else {
       // Dropped in the same column or invalid drop (e.g., status didn't change)
       // No action needed, setActiveTicket(null) was called at the start.
    }
    // No need for setActiveTicket(null) here, done at the start
   };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={fetchTickets} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {statuses.map(status => (
            <KanbanColumn 
              key={status.id} 
              id={status.id}
              title={status.name} 
              color={status.color}
              tickets={ticketsByStatus[status.id] || []}
              ticketIdSettings={ticketIdSettings}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTicket ? (
            <KanbanCard 
              ticket={activeTicket} 
              ticketIdSettings={ticketIdSettings}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
