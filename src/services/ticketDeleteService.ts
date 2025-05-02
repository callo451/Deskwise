import { supabase } from '../lib/supabase';

/**
 * Deletes a ticket directly
 * @param ticketId The ID of the ticket to delete
 * @returns Promise resolving to success status and any error message
 */
export const deleteTicket = async (ticketId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Attempting to delete ticket:', ticketId);

    // Try to delete ticket comments first (if they exist)
    try {
      await supabase
        .from('ticket_comments')
        .delete()
        .eq('ticket_id', ticketId);
      console.log('Deleted any ticket comments');
    } catch (err) {
      // Ignore errors with comments deletion
      console.log('No comments to delete or table does not exist');
    }

    // Try to delete ticket history (if it exists)
    try {
      await supabase
        .from('ticket_history')
        .delete()
        .eq('ticket_id', ticketId);
      console.log('Deleted any ticket history');
    } catch (err) {
      // Ignore errors with history deletion
      console.log('No history to delete or table does not exist');
    }
    
    // Delete the ticket directly - don't try to get count
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    
    if (error) {
      console.error('Error deleting ticket:', error);
      return { success: false, error: `Failed to delete ticket: ${error.message}` };
    }
    
    console.log('Delete operation completed');
    
    // Verify the ticket no longer exists
    const { data: checkData } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .single();
    
    if (checkData) {
      console.warn('Ticket still exists after deletion attempt');
      return { success: false, error: 'Ticket still exists after deletion attempt' };
    }
    
    console.log('Successfully deleted ticket');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteTicket:', error);
    return { 
      success: false, 
      error: error.message || 'An unknown error occurred while deleting the ticket'
    };
  }
};
