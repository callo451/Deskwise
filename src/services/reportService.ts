import { supabase } from '../lib/supabaseClient';
import { format, subDays } from 'date-fns';

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  priorities?: string[];
  statuses?: string[];
  assignees?: string[];
  queues?: string[];
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number; // in hours
  slaCompliance: number; // percentage
  firstResponseTime: number; // in hours
}

export interface KnowledgeBaseMetrics {
  totalArticles: number;
  publishedArticles: number;
  totalViews: number;
  avgFeedbackScore: number; // percentage
  mostViewedArticles: any[];
  articlesByCategory: any[];
}

export interface TicketTrend {
  date: string;
  count: number;
  status?: string;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
}

export interface AssigneePerformance {
  assignee: string;
  ticketsResolved: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

// Default filter for last 30 days
const defaultFilter: ReportFilter = {
  startDate: subDays(new Date(), 30),
  endDate: new Date()
};

// Get ticket metrics
export const getTicketMetrics = async (filter: ReportFilter = defaultFilter): Promise<TicketMetrics> => {
  const { startDate, endDate, categories, priorities, statuses, assignees, queues } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Base query for tickets within date range
  let query = supabase
    .from('tickets')
    .select('*')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  // Apply filters if provided
  if (categories && categories.length > 0) {
    query = query.in('category_id', categories);
  }
  
  if (priorities && priorities.length > 0) {
    query = query.in('priority_id', priorities);
  }
  
  if (statuses && statuses.length > 0) {
    query = query.in('status_id', statuses);
  }
  
  if (assignees && assignees.length > 0) {
    query = query.in('assigned_to', assignees);
  }
  
  if (queues && queues.length > 0) {
    query = query.in('queue_id', queues);
  }
  
  const { data: tickets, error } = await query;
  
  if (error) {
    console.error('Error fetching ticket metrics:', error);
    throw error;
  }
  
  // Get closed/resolved tickets
  const resolvedTickets = tickets.filter(ticket => {
    const statusQuery = supabase
      .from('ticket_statuses')
      .select('is_closed')
      .eq('id', ticket.status_id)
      .single();
      
    return statusQuery.then(({ data }) => data?.is_closed);
  });
  
  // Calculate metrics
  const totalTickets = tickets.length;
  const openTickets = totalTickets - resolvedTickets.length;
  
  // Calculate average resolution time for resolved tickets
  let totalResolutionTime = 0;
  resolvedTickets.forEach(ticket => {
    const createdAt = new Date(ticket.created_at);
    const updatedAt = new Date(ticket.updated_at);
    const resolutionTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
    totalResolutionTime += resolutionTime;
  });
  
  const avgResolutionTime = resolvedTickets.length > 0 ? totalResolutionTime / resolvedTickets.length : 0;
  
  // Calculate SLA compliance
  const ticketsWithSLA = tickets.filter(ticket => ticket.sla_id !== null);
  const compliantTickets = ticketsWithSLA.filter(ticket => ticket.sla_status === 'met');
  const slaCompliance = ticketsWithSLA.length > 0 ? (compliantTickets.length / ticketsWithSLA.length) * 100 : 100;
  
  // Calculate average first response time
  let totalFirstResponseTime = 0;
  const ticketsWithResponse = tickets.filter(ticket => ticket.first_response_time !== null);
  
  ticketsWithResponse.forEach(ticket => {
    const createdAt = new Date(ticket.created_at);
    const firstResponseTime = new Date(ticket.first_response_time as string);
    const responseTime = (firstResponseTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
    totalFirstResponseTime += responseTime;
  });
  
  const firstResponseTime = ticketsWithResponse.length > 0 ? totalFirstResponseTime / ticketsWithResponse.length : 0;
  
  return {
    totalTickets,
    openTickets,
    resolvedTickets: resolvedTickets.length,
    avgResolutionTime,
    slaCompliance,
    firstResponseTime
  };
};

// Get ticket trends over time
export const getTicketTrends = async (filter: ReportFilter = defaultFilter): Promise<TicketTrend[]> => {
  const { startDate, endDate, categories, priorities, statuses, assignees, queues } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Base query for tickets within date range
  let query = supabase
    .from('tickets')
    .select('created_at, status_id')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  // Apply filters if provided
  if (categories && categories.length > 0) {
    query = query.in('category_id', categories);
  }
  
  if (priorities && priorities.length > 0) {
    query = query.in('priority_id', priorities);
  }
  
  if (statuses && statuses.length > 0) {
    query = query.in('status_id', statuses);
  }
  
  if (assignees && assignees.length > 0) {
    query = query.in('assigned_to', assignees);
  }
  
  if (queues && queues.length > 0) {
    query = query.in('queue_id', queues);
  }
  
  const { data: tickets, error } = await query;
  
  if (error) {
    console.error('Error fetching ticket trends:', error);
    throw error;
  }
  
  // Group tickets by date
  const ticketsByDate: Record<string, number> = {};
  
  tickets.forEach(ticket => {
    const date = format(new Date(ticket.created_at), 'yyyy-MM-dd');
    ticketsByDate[date] = (ticketsByDate[date] || 0) + 1;
  });
  
  // Convert to array format for chart
  const trends: TicketTrend[] = Object.keys(ticketsByDate).map(date => ({
    date,
    count: ticketsByDate[date]
  }));
  
  // Sort by date
  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Get category distribution
export const getCategoryDistribution = async (filter: ReportFilter = defaultFilter): Promise<CategoryDistribution[]> => {
  const { startDate, endDate, priorities, statuses, assignees, queues } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Get all categories first
  const { data: categories, error: categoriesError } = await supabase
    .from('ticket_categories')
    .select('id, name')
    .eq('is_active', true);
  
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }
  
  // Base query for tickets within date range
  let query = supabase
    .from('tickets')
    .select('category_id, count')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  // Apply filters if provided
  if (priorities && priorities.length > 0) {
    query = query.in('priority_id', priorities);
  }
  
  if (statuses && statuses.length > 0) {
    query = query.in('status_id', statuses);
  }
  
  if (assignees && assignees.length > 0) {
    query = query.in('assigned_to', assignees);
  }
  
  if (queues && queues.length > 0) {
    query = query.in('queue_id', queues);
  }
  
  query = query.groupBy('category_id');
  
  const { data: ticketCounts, error } = await query;
  
  if (error) {
    console.error('Error fetching category distribution:', error);
    throw error;
  }
  
  // Map category IDs to names and counts
  const distribution: CategoryDistribution[] = categories.map(category => {
    const categoryCount = ticketCounts.find(tc => tc.category_id === category.id);
    return {
      category: category.name,
      count: categoryCount ? parseInt(categoryCount.count) : 0
    };
  });
  
  // Sort by count (descending)
  return distribution.sort((a, b) => b.count - a.count);
};

// Get knowledge base metrics
export const getKnowledgeBaseMetrics = async (filter: ReportFilter = defaultFilter): Promise<KnowledgeBaseMetrics> => {
  const { startDate, endDate } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Get all articles
  const { data: articles, error: articlesError } = await supabase
    .from('knowledge_base_articles')
    .select('*')
    .lte('created_at', `${end}T23:59:59`);
  
  if (articlesError) {
    console.error('Error fetching KB articles:', articlesError);
    throw articlesError;
  }
  
  // Get article views
  const { data: views, error: viewsError } = await supabase
    .from('knowledge_base_article_views')
    .select('article_id, count')
    .gte('viewed_at', `${start}T00:00:00`)
    .lte('viewed_at', `${end}T23:59:59`)
    .groupBy('article_id');
  
  if (viewsError) {
    console.error('Error fetching KB views:', viewsError);
    throw viewsError;
  }
  
  // Get article feedback
  const { data: feedback, error: feedbackError } = await supabase
    .from('knowledge_base_article_feedback')
    .select('article_id, helpful')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  if (feedbackError) {
    console.error('Error fetching KB feedback:', feedbackError);
    throw feedbackError;
  }
  
  // Calculate metrics
  const totalArticles = articles.length;
  const publishedArticles = articles.filter(article => article.is_published).length;
  
  // Calculate total views
  let totalViews = 0;
  views.forEach(view => {
    totalViews += parseInt(view.count);
  });
  
  // Calculate feedback score
  const totalFeedback = feedback.length;
  const positiveFeedback = feedback.filter(f => f.helpful).length;
  const avgFeedbackScore = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
  
  // Get most viewed articles
  const articlesWithViews = articles.map(article => {
    const articleViews = views.find(v => v.article_id === article.id);
    return {
      id: article.id,
      title: article.title,
      views: articleViews ? parseInt(articleViews.count) : 0
    };
  });
  
  const mostViewedArticles = articlesWithViews
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  
  // Get articles by category
  const { data: categories, error: categoriesError } = await supabase
    .from('knowledge_base_categories')
    .select('id, name');
  
  if (categoriesError) {
    console.error('Error fetching KB categories:', categoriesError);
    throw categoriesError;
  }
  
  const articlesByCategory = categories.map(category => {
    const count = articles.filter(article => article.category_id === category.id).length;
    return {
      category: category.name,
      count
    };
  }).sort((a, b) => b.count - a.count);
  
  return {
    totalArticles,
    publishedArticles,
    totalViews,
    avgFeedbackScore,
    mostViewedArticles,
    articlesByCategory
  };
};

// Get assignee performance metrics
export const getAssigneePerformance = async (filter: ReportFilter = defaultFilter): Promise<AssigneePerformance[]> => {
  const { startDate, endDate, categories, priorities, statuses, queues } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Get all technicians/assignees
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .in('role', ['technician', 'manager', 'admin'])
    .eq('is_active', true);
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    throw usersError;
  }
  
  // Base query for tickets within date range
  let query = supabase
    .from('tickets')
    .select('*')
    .not('assigned_to', 'is', null)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  // Apply filters if provided
  if (categories && categories.length > 0) {
    query = query.in('category_id', categories);
  }
  
  if (priorities && priorities.length > 0) {
    query = query.in('priority_id', priorities);
  }
  
  if (statuses && statuses.length > 0) {
    query = query.in('status_id', statuses);
  }
  
  if (queues && queues.length > 0) {
    query = query.in('queue_id', queues);
  }
  
  const { data: tickets, error } = await query;
  
  if (error) {
    console.error('Error fetching assignee performance:', error);
    throw error;
  }
  
  // Calculate performance metrics for each assignee
  const performance: AssigneePerformance[] = users.map(user => {
    const assigneeTickets = tickets.filter(ticket => ticket.assigned_to === user.id);
    const resolvedTickets = assigneeTickets.filter(ticket => {
      const statusQuery = supabase
        .from('ticket_statuses')
        .select('is_closed')
        .eq('id', ticket.status_id)
        .single();
        
      return statusQuery.then(({ data }) => data?.is_closed);
    });
    
    // Calculate average resolution time
    let totalResolutionTime = 0;
    resolvedTickets.forEach(ticket => {
      const createdAt = new Date(ticket.created_at);
      const updatedAt = new Date(ticket.updated_at);
      const resolutionTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
      totalResolutionTime += resolutionTime;
    });
    
    const avgResolutionTime = resolvedTickets.length > 0 ? totalResolutionTime / resolvedTickets.length : 0;
    
    // Calculate SLA compliance
    const ticketsWithSLA = assigneeTickets.filter(ticket => ticket.sla_id !== null);
    const compliantTickets = ticketsWithSLA.filter(ticket => ticket.sla_status === 'met');
    const slaCompliance = ticketsWithSLA.length > 0 ? (compliantTickets.length / ticketsWithSLA.length) * 100 : 100;
    
    return {
      assignee: `${user.first_name} ${user.last_name}`,
      ticketsResolved: resolvedTickets.length,
      avgResolutionTime,
      slaCompliance
    };
  });
  
  // Sort by tickets resolved (descending)
  return performance.sort((a, b) => b.ticketsResolved - a.ticketsResolved);
};

// Get SLA compliance by priority
export const getSLAComplianceByPriority = async (filter: ReportFilter = defaultFilter): Promise<any[]> => {
  const { startDate, endDate, categories, assignees, queues } = filter;
  
  // Format dates for Supabase query
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  // Get all priorities
  const { data: priorities, error: prioritiesError } = await supabase
    .from('ticket_priorities')
    .select('id, name')
    .order('sort_order', { ascending: true });
  
  if (prioritiesError) {
    console.error('Error fetching priorities:', prioritiesError);
    throw prioritiesError;
  }
  
  // Base query for tickets within date range
  let query = supabase
    .from('tickets')
    .select('priority_id, sla_status')
    .not('sla_id', 'is', null)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`);
  
  // Apply filters if provided
  if (categories && categories.length > 0) {
    query = query.in('category_id', categories);
  }
  
  if (assignees && assignees.length > 0) {
    query = query.in('assigned_to', assignees);
  }
  
  if (queues && queues.length > 0) {
    query = query.in('queue_id', queues);
  }
  
  const { data: tickets, error } = await query;
  
  if (error) {
    console.error('Error fetching SLA compliance by priority:', error);
    throw error;
  }
  
  // Calculate SLA compliance for each priority
  return priorities.map(priority => {
    const priorityTickets = tickets.filter(ticket => ticket.priority_id === priority.id);
    const compliantTickets = priorityTickets.filter(ticket => ticket.sla_status === 'met');
    const compliance = priorityTickets.length > 0 ? (compliantTickets.length / priorityTickets.length) * 100 : 100;
    
    return {
      priority: priority.name,
      compliance,
      total: priorityTickets.length,
      met: compliantTickets.length
    };
  });
};

// Get all filters data for report filters component
export const getFiltersData = async () => {
  // Get categories
  const { data: categories, error: categoriesError } = await supabase
    .from('ticket_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }
  
  // Get priorities
  const { data: priorities, error: prioritiesError } = await supabase
    .from('ticket_priorities')
    .select('id, name')
    .order('sort_order');
  
  if (prioritiesError) {
    console.error('Error fetching priorities:', prioritiesError);
    throw prioritiesError;
  }
  
  // Get statuses
  const { data: statuses, error: statusesError } = await supabase
    .from('ticket_statuses')
    .select('id, name')
    .order('sort_order');
  
  if (statusesError) {
    console.error('Error fetching statuses:', statusesError);
    throw statusesError;
  }
  
  // Get assignees (technicians, managers, admins)
  const { data: assignees, error: assigneesError } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .in('role', ['technician', 'manager', 'admin'])
    .eq('is_active', true)
    .order('first_name');
  
  if (assigneesError) {
    console.error('Error fetching assignees:', assigneesError);
    throw assigneesError;
  }
  
  // Format assignees with full name
  const formattedAssignees = assignees.map(user => ({
    id: user.id,
    name: `${user.first_name} ${user.last_name}`
  }));
  
  // Get queues
  const { data: queues, error: queuesError } = await supabase
    .from('queues')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  
  if (queuesError) {
    console.error('Error fetching queues:', queuesError);
    throw queuesError;
  }
  
  return {
    categories,
    priorities,
    statuses,
    assignees: formattedAssignees,
    queues
  };
};
