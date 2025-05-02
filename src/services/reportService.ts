import { supabase } from '../lib/supabase';
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

// Problems interfaces
export interface RecurringIssue {
  id: number;
  title: string;
  count: number;
  category: string;
}

export interface UnresolvedProblem {
  id: number;
  title: string;
  count: number;
  priority: string;
  age: number;
}

export interface ProblemCategory {
  category: string;
  count: number;
}

export interface ProblemsData {
  recurring: RecurringIssue[];
  unresolved: UnresolvedProblem[];
  byCategory: ProblemCategory[];
}

// Improvements interfaces
export interface ImprovementSuggestion {
  id: number;
  title: string;
  votes: number;
  source: string;
}

export interface ImplementedImprovement {
  id: number;
  title: string;
  date: string;
  impact: string;
}

export interface PendingImprovement {
  id: number;
  title: string;
  status: string;
  estimatedCompletion: string;
}

export interface ImprovementsData {
  suggestions: ImprovementSuggestion[];
  implemented: ImplementedImprovement[];
  pending: PendingImprovement[];
}

// Changes interfaces
export interface RecentChange {
  id: number;
  title: string;
  date: string;
  author: string;
}

export interface UpcomingChange {
  id: number;
  title: string;
  date: string;
  type: string;
}

export interface ChangeImpact {
  impact: string;
  count: number;
}

export interface ChangesData {
  recent: RecentChange[];
  upcoming: UpcomingChange[];
  byImpact: ChangeImpact[];
}

// Default filter for last 30 days
const defaultFilter: ReportFilter = {
  startDate: subDays(new Date(), 30),
  endDate: new Date()
};

// Helper function to get date range from filter
const getDateRangeFromFilter = (filter: ReportFilter): { startDate: string, endDate: string } => {
  const startDate = filter.startDate ? format(filter.startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const endDate = filter.endDate ? format(filter.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  return { startDate, endDate };
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
  try {
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
    
    if (!categories || categories.length === 0) {
      return [];
    }
    
    // Base query for tickets within date range
    let query = supabase
      .from('tickets')
      .select('*')
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
    
    const { data: ticketData, error } = await query;
    
    if (error) {
      console.error('Error fetching tickets for category distribution:', error);
      throw error;
    }
    
    if (!ticketData) {
      return categories.map(category => ({
        category: category.name,
        count: 0
      }));
    }
    
    // Process the data to count by category
    const categoryCounts: Record<string, number> = {};
    
    // Initialize counts for all categories
    categories.forEach(category => {
      categoryCounts[category.id] = 0;
    });
    
    // Count tickets by category
    ticketData.forEach(ticket => {
      if (ticket.category_id && categoryCounts[ticket.category_id] !== undefined) {
        categoryCounts[ticket.category_id]++;
      }
    });
  
    // Map category IDs to names and counts
    const distribution: CategoryDistribution[] = categories.map(category => ({
      category: category.name,
      count: categoryCounts[category.id] || 0
    }));
    
    // Sort by count (descending)
    return distribution.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error in getCategoryDistribution:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
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
  const { data: allViews, error: viewsError } = await supabase
    .from('knowledge_base_article_views')
    .select('article_id, count')
    .gte('viewed_at', `${start}T00:00:00`)
    .lte('viewed_at', `${end}T23:59:59`);
  
  if (viewsError) {
    console.error('Error fetching KB views:', viewsError);
    throw viewsError;
  }
  
  // Process views to count by article
  const viewsMap: Record<string, number> = {};
  
  if (allViews) {
    allViews.forEach((view: { article_id: string }) => {
      if (view.article_id) {
        viewsMap[view.article_id] = (viewsMap[view.article_id] || 0) + 1;
      }
    });
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
  Object.values(viewsMap).forEach(count => {
    totalViews += count;
  });
  
  // Calculate feedback score
  const totalFeedback = feedback.length;
  const positiveFeedback = feedback.filter(f => f.helpful).length;
  const avgFeedbackScore = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
  
  // Get most viewed articles
  const articlesWithViews = articles.map(article => {
    const articleViews = viewsMap[article.id];
    return {
      id: article.id,
      title: article.title,
      views: articleViews || 0
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
  try {
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('ticket_categories')
      .select('id, name')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Get priorities
    const { data: priorities, error: prioritiesError } = await supabase
      .from('ticket_priorities')
      .select('id, name')
      .order('name');

    if (prioritiesError) {
      console.error('Error fetching priorities:', prioritiesError);
      throw prioritiesError;
    }

    // Get statuses
    const { data: statuses, error: statusesError } = await supabase
      .from('ticket_statuses')
      .select('id, name')
      .order('name');

    if (statusesError) {
      console.error('Error fetching statuses:', statusesError);
      throw statusesError;
    }

    // Get assignees (users)
    const { data: assignees, error: assigneesError } = await supabase
      .from('users')
      .select('id, name')
      .order('name');

    if (assigneesError) {
      console.error('Error fetching assignees:', assigneesError);
      // Return empty array for assignees instead of throwing
      return {
        categories: categories || [],
        priorities: priorities || [],
        statuses: statuses || [],
        assignees: [],
        queues: []
      };
    }

    // Get queues
    const { data: queues, error: queuesError } = await supabase
      .from('ticket_queues')
      .select('id, name')
      .order('name');

    if (queuesError) {
      console.error('Error fetching queues:', queuesError);
      // Return data without queues
      return {
        categories: categories || [],
        priorities: priorities || [],
        statuses: statuses || [],
        assignees: assignees || [],
        queues: []
      };
    }

    return {
      categories: categories || [],
      priorities: priorities || [],
      statuses: statuses || [],
      assignees: assignees || [],
      queues: queues || []
    };
  } catch (error) {
    console.error('Error fetching filters data:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      categories: [],
      priorities: [],
      statuses: [],
      assignees: [],
      queues: []
    };
  }
};

// Get problems data for the Problems tab
export const getProblemsData = async (filters: ReportFilter = defaultFilter): Promise<ProblemsData> => {
  try {
    const { startDate, endDate } = getDateRangeFromFilter(filters);

    // Get recurring issues from the problems table
    const { data: problemsData, error: problemsError } = await supabase
      .from('problems')
      .select('id, title, category_id, created_at, ticket_categories(name)')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (problemsError) throw problemsError;

    // Process recurring issues data
    const issueCountMap = new Map<string, RecurringIssue>();
    problemsData?.forEach((problem: any) => {
      const title = problem.title.toLowerCase();
      if (!issueCountMap.has(title)) {
        issueCountMap.set(title, {
          id: problem.id,
          title: problem.title,
          count: 0,
          category: problem.ticket_categories && typeof problem.ticket_categories === 'object' ? problem.ticket_categories.name : 'Uncategorized'
        });
      }
      const issue = issueCountMap.get(title);
      if (issue) issue.count++;
    });

    // Sort by count and take top issues
    const recurring = Array.from(issueCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get unresolved problems
    const { data: unresolvedData, error: unresolvedError } = await supabase
      .from('problems')
      .select('id, title, priority, created_at')
      .in('status', ['identified', 'investigating', 'diagnosed', 'known_error']) // Filter by unresolved statuses
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (unresolvedError) throw unresolvedError;

    // Process unresolved problems data
    const unresolvedCountMap = new Map<string, UnresolvedProblem>();
    const now = new Date();
    unresolvedData?.forEach(problem => {
      const title = problem.title.toLowerCase();
      if (!unresolvedCountMap.has(title)) {
        const createdAt = new Date(problem.created_at);
        const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        unresolvedCountMap.set(title, {
          id: problem.id,
          title: problem.title,
          count: 0,
          priority: problem.priority || 'Medium',
          age: ageInDays
        });
      }
      const issue = unresolvedCountMap.get(title);
      if (issue) issue.count++;
    });

    // Sort by priority and age
    const unresolved = Array.from(unresolvedCountMap.values())
      .sort((a, b) => {
        // Sort by priority first (Critical > High > Medium > Low)
        const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                            (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        // Then by age (older first)
        return b.age - a.age;
      })
      .slice(0, 10);

    // Process category data using the existing problemsData
    const categoryCounts: Record<string, number> = {};
    
    if (problemsData) {
      problemsData.forEach((problem: any) => {
        if (problem.ticket_categories && typeof problem.ticket_categories === 'object') {
          const categoryName = problem.ticket_categories.name;
          if (categoryName) {
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
          }
        }
      });
    }

    // Map category IDs to names and counts
    const byCategory = Object.keys(categoryCounts).map(category => ({
      category,
      count: categoryCounts[category]
    })).sort((a, b) => b.count - a.count);

    return {
      recurring,
      unresolved,
      byCategory
    };
  } catch (error) {
    console.error('Error fetching problems data:', error);
    throw error;
  }
};

// Get improvements data for the Improvements tab
export const getImprovementsData = async (filters: ReportFilter = defaultFilter): Promise<ImprovementsData> => {
  try {
    const { startDate, endDate } = getDateRangeFromFilter(filters);

    // Get improvement suggestions
    const { data: suggestionsData, error: suggestionsError } = await supabase
      .from('improvement_suggestions')
      .select('id, title, votes, source')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('votes', { ascending: false })
      .limit(10);

    if (suggestionsError) throw suggestionsError;

    // Get implemented improvements
    const { data: implementedData, error: implementedError } = await supabase
      .from('implemented_improvements')
      .select('id, title, implementation_date, impact')
      .gte('implementation_date', startDate)
      .lte('implementation_date', endDate);
      
    if (implementedError) {
      console.error('Error fetching implemented improvements:', implementedError);
      throw implementedError;
    }
    
    // Get pending improvements
    const { data: pendingData, error: pendingError } = await supabase
      .from('pending_improvements')
      .select('id, title, status, estimated_completion_date')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
      
    if (pendingError) {
      console.error('Error fetching pending improvements:', pendingError);
      throw pendingError;
    }
    
    // Process the data
    const suggestions = suggestionsData?.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      votes: suggestion.votes || 0,
      source: suggestion.source || 'User feedback'
    })) || [];
    
    const implemented = implementedData?.map(improvement => ({
      id: improvement.id,
      title: improvement.title,
      date: format(new Date(improvement.implementation_date), 'yyyy-MM-dd'),
      impact: improvement.impact
    })) || [];
    
    const pending = pendingData?.map(improvement => ({
      id: improvement.id,
      title: improvement.title,
      status: improvement.status,
      estimatedCompletion: improvement.estimated_completion_date ? 
        format(new Date(improvement.estimated_completion_date), 'yyyy-MM-dd') : 
        'Not scheduled'
    })) || [];
    
    return {
      suggestions,
      implemented,
      pending
    };
  } catch (error) {
    console.error('Error fetching improvements data:', error);
    throw error;
  }
};

// Function to get changes data for the Changes tab
export const getChangesData = async (filters: ReportFilter = defaultFilter): Promise<ChangesData> => {
  try {
    const { startDate, endDate } = getDateRangeFromFilter(filters);

    // Get recent changes
    const { data: recentData, error: recentError } = await supabase
      .from('system_changes')
      .select('id, title, change_date, author')
      .gte('change_date', startDate)
      .lte('change_date', endDate)
      .order('change_date', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    // Get upcoming changes
    const { data: upcomingData, error: upcomingError } = await supabase
      .from('upcoming_changes')
      .select('id, title, planned_date, change_type')
      .gte('planned_date', new Date().toISOString())
      .order('planned_date', { ascending: true })
      .limit(10);

    if (upcomingError) throw upcomingError;

    // Get changes by impact level
    const { data: changesData, error: impactError } = await supabase
      .from('system_changes')
      .select('impact_level')
      .gte('change_date', startDate)
      .lte('change_date', endDate);

    if (impactError) throw impactError;

    // Process impact data
    const impactCounts: Record<string, number> = {};
    
    if (changesData) {
      changesData.forEach((change: any) => {
        if (change.impact_level && typeof change.impact_level === 'object') {
          const impact = change.impact_level.name;
          if (impact) {
            impactCounts[impact] = (impactCounts[impact] || 0) + 1;
          }
        }
      });
    }

    // Format the data to match our interfaces
    const recent = recentData?.map((item: any) => ({
      id: item.id,
      title: item.title,
      date: format(new Date(item.change_date), 'yyyy-MM-dd'),
      author: item.author
    })) || [];

    const upcoming = upcomingData?.map((item: any) => ({
      id: item.id,
      title: item.title,
      date: format(new Date(item.planned_date), 'yyyy-MM-dd'),
      type: item.change_type
    })) || [];

    // Convert impact counts to array format
    const byImpact: ChangeImpact[] = Object.entries(impactCounts).map(([impact, count]) => ({
      impact,
      count
    })).sort((a, b) => {
      // Sort by impact level (High > Medium > Low)
      const impactOrder: Record<string, number> = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return (impactOrder[a.impact as keyof typeof impactOrder] || 1) - 
             (impactOrder[b.impact as keyof typeof impactOrder] || 1);
    });

    return {
      recent,
      upcoming,
      byImpact
    };
  } catch (error) {
    console.error('Error fetching changes data:', error);
    // Return empty data instead of throwing to prevent app crashes
    return {
      recent: [],
      upcoming: [],
      byImpact: []
    };
  }
};
