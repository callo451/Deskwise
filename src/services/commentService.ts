import { supabase } from '../lib/supabase';
import { TicketComment } from '../types/database';

export interface CreateCommentData {
  ticket_id: string;
  content: string;
  is_internal?: boolean;
  is_visible?: boolean;
}

export interface UpdateCommentData {
  content?: string;
  is_internal?: boolean;
  is_visible?: boolean;
}

/**
 * Fetches comments for a specific ticket
 */
export const getTicketComments = async (
  ticketId: string,
  options: {
    includeInternal?: boolean;
    includeInvisible?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ comments: TicketComment[], count: number | null }> => {
  const {
    includeInternal = true,
    includeInvisible = false,
    limit = 50,
    offset = 0,
  } = options;

  let query = supabase
    .from('ticket_comments')
    .select(`
      *,
      user:users(id, first_name, last_name, email)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter out internal comments if not requested
  if (!includeInternal) {
    query = query.eq('is_internal', false);
  }

  // Filter out invisible comments if not requested
  if (!includeInvisible) {
    query = query.eq('is_visible', true);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { comments: data, count };
};

/**
 * Creates a new comment for a ticket
 */
export const createTicketComment = async (commentData: CreateCommentData): Promise<TicketComment> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }

  // Get the user's tenant_id
  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user.id)
    .single();
    
  if (userDetailsError) {
    throw userDetailsError;
  }

  const { data, error } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: commentData.ticket_id,
      user_id: userData.user.id,
      content: commentData.content,
      is_internal: commentData.is_internal || false,
      is_visible: commentData.is_visible !== undefined ? commentData.is_visible : true,
      tenant_id: userDetails.tenant_id,
    })
    .select(`
      *,
      user:users(id, first_name, last_name, email)
    `)
    .single();

  if (error) {
    throw error;
  }

  // Create a ticket history entry for the comment
  try {
    const { error: historyError } = await supabase
      .from('ticket_history')
      .insert({
        ticket_id: commentData.ticket_id,
        user_id: userData.user.id,
        action: commentData.is_internal ? 'internal_comment_added' : 'comment_added',
        details: { comment_id: data.id },
        tenant_id: userDetails.tenant_id,
      });

    if (historyError) {
      console.error('Error creating ticket history for comment:', historyError);
    }
  } catch (err) {
    console.error('Error creating ticket history for comment:', err);
  }

  return data;
};

/**
 * Updates an existing comment
 */
export const updateTicketComment = async (id: string, commentData: UpdateCommentData): Promise<TicketComment> => {
  const { data, error } = await supabase
    .from('ticket_comments')
    .update({
      content: commentData.content,
      is_internal: commentData.is_internal,
      is_visible: commentData.is_visible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      user:users(id, first_name, last_name, email)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Deletes a comment
 */
export const deleteTicketComment = async (id: string) => {
  const { error } = await supabase
    .from('ticket_comments')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};
