import { supabase } from '../lib/supabase';

/**
 * Search for knowledge base articles and tickets
 * @param query The search query
 * @param limit Optional limit for results (default: 10)
 */
export const searchPortal = async (query: string, limit: number = 10) => {
  console.log('Searching portal with query:', query);
  
  if (!query || query.trim().length < 2) {
    return { articles: [], tickets: [] };
  }
  
  try {
    // Get the current user's tenant_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    
    // Check if the user has the required role
    const { data: userDetails, error: roleError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userData.user?.id)
      .single();
    
    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error(`Error fetching user details: ${roleError.message}`);
    }
    
    if (!userDetails) {
      console.error('No user details found');
      throw new Error('User details not found');
    }
    
    const tenant_id = userDetails.tenant_id;
    
    // Search for knowledge base articles
    const { data: articles, error: articlesError } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, summary, category_id, category:knowledge_base_categories(name)')
      .eq('tenant_id', tenant_id)
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);
    
    if (articlesError) {
      console.error('Error searching articles:', articlesError);
      throw articlesError;
    }
    
    // Search for tickets created by the current user
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, description, status:ticket_statuses(name), priority:ticket_priorities(name), created_at')
      .eq('tenant_id', tenant_id)
      .eq('created_by', userData.user?.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (ticketsError) {
      console.error('Error searching tickets:', ticketsError);
      throw ticketsError;
    }
    
    return {
      articles: articles || [],
      tickets: tickets || []
    };
  } catch (error) {
    console.error('Error in searchPortal:', error);
    throw error;
  }
};
