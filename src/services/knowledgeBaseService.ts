import { supabase } from '../lib/supabase';

export interface CreateKnowledgeBaseArticleData {
  title: string;
  content: string;
  category_id?: string;
  tags?: string[];
  is_published?: boolean;
}

export interface UpdateKnowledgeBaseArticleData {
  title?: string;
  content?: string;
  category_id?: string | null;
  tags?: string[] | null;
  is_published?: boolean;
}

/**
 * Fetches knowledge base articles with optional filtering
 */
export const getKnowledgeBaseArticles = async (
  options: {
    category_id?: string;
    is_published?: boolean;
    search_query?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}
) => {
  const {
    category_id,
    is_published,
    search_query,
    tags,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
  } = options;

  let query = supabase
    .from('knowledge_base_articles')
    .select(`
      *,
      created_by_user:users!knowledge_base_articles_created_by_fkey(id, first_name, last_name, email),
      category:knowledge_base_categories(id, name, icon)
    `)
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + limit - 1);

  if (category_id) {
    query = query.eq('category_id', category_id);
  }

  if (is_published !== undefined) {
    query = query.eq('is_published', is_published);
  }

  if (search_query) {
    query = query.or(`title.ilike.%${search_query}%,content.ilike.%${search_query}%`);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { articles: data, count };
};

/**
 * Fetches a single knowledge base article by ID
 */
export const getKnowledgeBaseArticleById = async (id: string) => {
  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .select(`
      *,
      created_by_user:users!knowledge_base_articles_created_by_fkey(id, first_name, last_name, email),
      category:knowledge_base_categories(id, name, icon)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates a new knowledge base article
 */
export const createKnowledgeBaseArticle = async (articleData: CreateKnowledgeBaseArticleData) => {
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
    .from('knowledge_base_articles')
    .insert({
      title: articleData.title,
      content: articleData.content,
      category_id: articleData.category_id && articleData.category_id.trim() !== '' ? articleData.category_id : null,
      tags: articleData.tags || [],
      is_published: articleData.is_published !== undefined ? articleData.is_published : false,
      created_by: userData.user.id,
      tenant_id: userDetails.tenant_id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Updates an existing knowledge base article
 */
export const updateKnowledgeBaseArticle = async (id: string, articleData: UpdateKnowledgeBaseArticleData) => {
  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .update({
      title: articleData.title,
      content: articleData.content,
      category_id: articleData.category_id && articleData.category_id.trim() !== '' ? articleData.category_id : null,
      tags: articleData.tags,
      is_published: articleData.is_published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Deletes a knowledge base article
 */
export const deleteKnowledgeBaseArticle = async (id: string) => {
  const { error } = await supabase
    .from('knowledge_base_articles')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Gets knowledge base categories
 */
export const getKnowledgeBaseCategories = async (includeInactive = false) => {
  let query = supabase
    .from('knowledge_base_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Creates a new knowledge base category
 */
export const createKnowledgeBaseCategory = async (categoryData: {
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}) => {
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
    .from('knowledge_base_categories')
    .insert({
      name: categoryData.name,
      description: categoryData.description,
      parent_id: categoryData.parent_id,
      icon: categoryData.icon,
      sort_order: categoryData.sort_order || 0,
      is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
      tenant_id: userDetails.tenant_id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Updates an existing knowledge base category
 */
export const updateKnowledgeBaseCategory = async (
  id: string,
  categoryData: {
    name?: string;
    description?: string | null;
    parent_id?: string | null;
    icon?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from('knowledge_base_categories')
    .update({
      name: categoryData.name,
      description: categoryData.description,
      parent_id: categoryData.parent_id,
      icon: categoryData.icon,
      sort_order: categoryData.sort_order,
      is_active: categoryData.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Records a view of a knowledge base article
 */
export const recordArticleView = async (articleId: string) => {
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

  const { error } = await supabase
    .from('knowledge_base_article_views')
    .insert({
      article_id: articleId,
      user_id: userData.user.id,
      tenant_id: userDetails.tenant_id,
    });

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Submit feedback for a knowledge base article
 */
export const submitArticleFeedback = async (
  articleId: string,
  feedback: {
    helpful: boolean;
    comment?: string;
  }
) => {
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
    .from('knowledge_base_article_feedback')
    .insert({
      article_id: articleId,
      user_id: userData.user.id,
      helpful: feedback.helpful,
      comment: feedback.comment,
      tenant_id: userDetails.tenant_id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Link a knowledge base article to a ticket
 */
export const linkArticleToTicket = async (ticketId: string, articleId: string) => {
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
    .from('ticket_knowledge_base_links')
    .insert({
      ticket_id: ticketId,
      article_id: articleId,
      created_by: userData.user.id,
      tenant_id: userDetails.tenant_id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Unlink a knowledge base article from a ticket
 */
export const unlinkArticleFromTicket = async (ticketId: string, articleId: string) => {
  const { error } = await supabase
    .from('ticket_knowledge_base_links')
    .delete()
    .match({ ticket_id: ticketId, article_id: articleId });

  if (error) {
    throw error;
  }

  return true;
};

/**
 * Get knowledge base articles linked to a ticket
 */
export const getLinkedArticles = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('ticket_knowledge_base_links')
    .select(`
      article_id,
      knowledge_base_articles!inner(
        id,
        title,
        content,
        category_id,
        tags,
        is_published,
        created_by,
        created_at,
        updated_at,
        category:knowledge_base_categories(id, name, icon)
      )
    `)
    .eq('ticket_id', ticketId);

  if (error) {
    throw error;
  }

  return data.map((item: any) => item.knowledge_base_articles);
};

/**
 * Get tickets linked to a knowledge base article
 */
export const getLinkedTickets = async (articleId: string) => {
  const { data, error } = await supabase
    .from('ticket_knowledge_base_links')
    .select(`
      ticket_id,
      tickets!inner(*)
    `)
    .eq('article_id', articleId);

  if (error) {
    throw error;
  }

  return data.map((item: any) => item.tickets);
};

/**
 * Search knowledge base articles
 */
export const searchKnowledgeBase = async (query: string, options: {
  category_id?: string;
  is_published?: boolean;
  limit?: number;
} = {}) => {
  const { category_id, is_published, limit = 10 } = options;

  let dbQuery = supabase
    .from('knowledge_base_articles')
    .select(`
      *,
      category:knowledge_base_categories(id, name, icon)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit);

  if (category_id) {
    dbQuery = dbQuery.eq('category_id', category_id);
  }

  if (is_published !== undefined) {
    dbQuery = dbQuery.eq('is_published', is_published);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Get article view statistics
 */
export const getArticleViewStats = async (articleId: string) => {
  const { data, error } = await supabase
    .from('knowledge_base_article_views')
    .select('*', { count: 'exact' })
    .eq('article_id', articleId);

  if (error) {
    throw error;
  }

  return {
    total_views: data.length,
    unique_views: new Set(data.map(view => view.user_id)).size,
  };
};

/**
 * Get article feedback statistics
 */
export const getArticleFeedbackStats = async (articleId: string) => {
  const { data, error } = await supabase
    .from('knowledge_base_article_feedback')
    .select('*')
    .eq('article_id', articleId);

  if (error) {
    throw error;
  }

  const helpful = data.filter(feedback => feedback.helpful).length;
  const notHelpful = data.length - helpful;

  return {
    total_feedback: data.length,
    helpful,
    not_helpful: notHelpful,
    helpful_percentage: data.length > 0 ? (helpful / data.length) * 100 : 0,
  };
};
