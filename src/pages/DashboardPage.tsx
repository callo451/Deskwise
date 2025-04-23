import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Ticket, KnowledgeBaseArticle, Problem, Change, Improvement } from '../types/database';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define metric card interface
interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  description: string;
  badge: {
    text: string;
    color: string;
  };
  isEnabled: boolean;
}

const DashboardPage: React.FC = () => {
  const { userDetails } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [ticketsByDay, setTicketsByDay] = useState<{date: string; count: number}[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{category: string; count: number}[]>([]);
  const [slaCompliance, setSlaCompliance] = useState<number>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number>(0);
  const [kbViews, setKbViews] = useState<number>(0);
  const [kbHelpfulRate, setKbHelpfulRate] = useState<number>(0);
  const [changeSuccess, setChangeSuccess] = useState<number>(0);
  const [problemResolution, setProblemResolution] = useState<number>(0);
  const [improvementProgress, setImprovementProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMetricsDropdown, setShowMetricsDropdown] = useState(false);
  
  // State for metric cards configuration
  const [metricCards, setMetricCards] = useState<MetricCard[]>([]);
  
  // Initialize metric cards after data is loaded
  useEffect(() => {
    if (!isLoading) {
      setMetricCards([
        {
          id: 'open-tickets',
          title: 'Open Tickets',
          value: tickets.filter(t => t.status === 'open').length,
          description: 'Tickets requiring attention',
          badge: {
            text: tickets.filter(t => t.status === 'open').length.toString(),
            color: 'blue'
          },
          isEnabled: true
        },
        {
          id: 'sla-compliance',
          title: 'SLA Compliance',
          value: `${slaCompliance.toFixed(1)}%`,
          description: 'Service level compliance rate',
          badge: {
            text: 'ITIL Metric',
            color: 'indigo'
          },
          isEnabled: true
        },
        {
          id: 'response-time',
          title: 'Response Time',
          value: `${avgResponseTime.toFixed(1)}h`,
          description: 'Average first response time',
          badge: {
            text: 'ITIL Metric',
            color: 'purple'
          },
          isEnabled: true
        },
        {
          id: 'kb-effectiveness',
          title: 'KB Effectiveness',
          value: kbViews,
          description: 'Knowledge base views in 30 days',
          badge: {
            text: `${kbHelpfulRate.toFixed(1)}%`,
            color: 'green'
          },
          isEnabled: true
        },
        {
          id: 'problem-resolution',
          title: 'Problem Resolution',
          value: `${problemResolution.toFixed(1)}%`,
          description: 'Problem resolution rate',
          badge: {
            text: 'Problem Mgmt',
            color: 'red'
          },
          isEnabled: true
        },
        {
          id: 'change-success',
          title: 'Change Success',
          value: `${changeSuccess.toFixed(1)}%`,
          description: 'Change implementation success rate',
          badge: {
            text: 'Change Mgmt',
            color: 'amber'
          },
          isEnabled: true
        },
        {
          id: 'improvement-progress',
          title: 'Improvement Progress',
          value: `${improvementProgress.toFixed(1)}%`,
          description: 'Average improvement progress',
          badge: {
            text: 'Improvement Mgmt',
            color: 'emerald'
          },
          isEnabled: true
        }
      ]);
    }
  }, [isLoading, tickets, slaCompliance, avgResponseTime, kbViews, kbHelpfulRate, problemResolution, changeSuccess, improvementProgress]);
  
  // Toggle metric card visibility
  const toggleMetricCard = (id: string) => {
    setMetricCards(prevCards => 
      prevCards.map(card => 
        card.id === id ? { ...card, isEnabled: !card.isEnabled } : card
      )
    );
  };
  
  // Get visible metric cards
  const visibleMetricCards = metricCards.filter(card => card.isEnabled);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get date range for metrics (last 30 days)
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch recent tickets
        const { data: recentTickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (ticketsError) throw ticketsError;
        setTickets(recentTickets || []);
        
        // Fetch ticket metrics
        const { data: allTickets, error: allTicketsError } = await supabase
          .from('tickets')
          .select('*')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);

        if (allTicketsError) throw allTicketsError;
        
        // Calculate SLA compliance
        const ticketsWithSLA = allTickets.filter(ticket => ticket.sla_id !== null);
        const compliantTickets = ticketsWithSLA.filter(ticket => ticket.sla_status === 'met');
        const compliance = ticketsWithSLA.length > 0 ? (compliantTickets.length / ticketsWithSLA.length) * 100 : 100;
        setSlaCompliance(compliance);
        
        // Calculate average response time
        const ticketsWithResponse = allTickets.filter(ticket => ticket.first_response_time !== null);
        let totalResponseTime = 0;
        
        ticketsWithResponse.forEach(ticket => {
          const createdAt = new Date(ticket.created_at);
          const respondedAt = new Date(ticket.first_response_time as string);
          const responseTime = (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
          totalResponseTime += responseTime;
        });
        
        const avgResponse = ticketsWithResponse.length > 0 ? totalResponseTime / ticketsWithResponse.length : 0;
        setAvgResponseTime(avgResponse);
        
        // Get tickets by day for the chart
        const ticketDates = {};
        allTickets.forEach(ticket => {
          const date = format(new Date(ticket.created_at), 'MMM dd');
          ticketDates[date] = (ticketDates[date] || 0) + 1;
        });
        
        const ticketTrends = Object.keys(ticketDates).map(date => ({
          date,
          count: ticketDates[date]
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setTicketsByDay(ticketTrends);
        
        // Get category distribution
        const { data: categories, error: categoriesError } = await supabase
          .from('ticket_categories')
          .select('id, name');
          
        if (categoriesError) throw categoriesError;
        
        const categoryCounts = {};
        allTickets.forEach(ticket => {
          if (ticket.category_id) {
            categoryCounts[ticket.category_id] = (categoryCounts[ticket.category_id] || 0) + 1;
          }
        });
        
        const categoryData = categories
          .map(category => ({
            category: category.name,
            count: categoryCounts[category.id] || 0
          }))
          .filter(item => item.count > 0)
          .sort((a, b) => b.count - a.count);
          
        setCategoryDistribution(categoryData);
        
        // Fetch KB metrics
        const { data: kbData, error: kbError } = await supabase
          .from('knowledge_base_articles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (kbError) throw kbError;
        setKbArticles(kbData || []);
        
        // Get KB views
        const { data: viewsData, error: viewsError } = await supabase
          .from('knowledge_base_article_views')
          .select('count')
          .gte('viewed_at', `${startDate}T00:00:00`)
          .lte('viewed_at', `${endDate}T23:59:59`);
          
        if (viewsError) throw viewsError;
        
        let totalViews = 0;
        viewsData.forEach(view => {
          totalViews += parseInt(view.count || '0');
        });
        
        setKbViews(totalViews);
        
        // Get KB feedback metrics
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('knowledge_base_article_feedback')
          .select('helpful')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
          
        if (feedbackError) throw feedbackError;
        
        const totalFeedback = feedbackData.length;
        const helpfulFeedback = feedbackData.filter(f => f.helpful).length;
        const helpfulRate = totalFeedback > 0 ? (helpfulFeedback / totalFeedback) * 100 : 0;
        
        setKbHelpfulRate(helpfulRate);
        
        // Fetch Problems data
        const { data: problemsData, error: problemsError } = await supabase
          .from('problems')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (problemsError) throw problemsError;
        setProblems(problemsData || []);
        
        // Calculate problem resolution rate
        const { data: allProblems, error: allProblemsError } = await supabase
          .from('problems')
          .select('*')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
          
        if (allProblemsError) throw allProblemsError;
        
        const resolvedProblems = allProblems.filter(p => p.status === 'resolved');
        const resolutionRate = allProblems.length > 0 ? (resolvedProblems.length / allProblems.length) * 100 : 0;
        setProblemResolution(resolutionRate);
        
        // Fetch Changes data
        const { data: changesData, error: changesError } = await supabase
          .from('changes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (changesError) throw changesError;
        setChanges(changesData || []);
        
        // Calculate change success rate
        const { data: allChanges, error: allChangesError } = await supabase
          .from('changes')
          .select('*')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
          
        if (allChangesError) throw allChangesError;
        
        const successfulChanges = allChanges.filter(c => c.status === 'implemented' && c.outcome === 'successful');
        const successRate = allChanges.length > 0 ? (successfulChanges.length / allChanges.length) * 100 : 0;
        setChangeSuccess(successRate);
        
        // Fetch Improvements data
        const { data: improvementsData, error: improvementsError } = await supabase
          .from('improvements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (improvementsError) throw improvementsError;
        setImprovements(improvementsData || []);
        
        // Calculate improvement progress
        const { data: allImprovements, error: allImprovementsError } = await supabase
          .from('improvements')
          .select('*')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
          
        if (allImprovementsError) throw allImprovementsError;
        
        let totalProgress = 0;
        allImprovements.forEach(imp => {
          totalProgress += imp.progress || 0;
        });
        
        const avgProgress = allImprovements.length > 0 ? totalProgress / allImprovements.length : 0;
        setImprovementProgress(avgProgress);
        
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data for ticket trends
  const ticketTrendsChartData = {
    labels: ticketsByDay.map(item => item.date),
    datasets: [
      {
        label: 'Tickets Created',
        data: ticketsByDay.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  };
  
  // Prepare chart data for category distribution
  const categoryChartData = {
    labels: categoryDistribution.slice(0, 5).map(item => item.category),
    datasets: [
      {
        label: 'Tickets by Category',
        data: categoryDistribution.slice(0, 5).map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userDetails?.first_name || 'User'}! Here's an overview of your workspace.
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMetricsDropdown(!showMetricsDropdown)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
          >
            <span>Customize Metrics</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showMetricsDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                Select metrics to display
              </div>
              {metricCards.map(card => (
                <div key={card.id} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                  <label htmlFor={`metric-${card.id}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                    {card.title}
                  </label>
                  <input
                    id={`metric-${card.id}`}
                    type="checkbox"
                    checked={card.isEnabled}
                    onChange={() => toggleMetricCard(card.id)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {visibleMetricCards.length > 0 ? (
            visibleMetricCards.map(card => (
              <div key={card.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">{card.title}</h3>
                  <div className={`bg-${card.badge.color}-100 text-${card.badge.color}-800 text-xs font-medium rounded-full px-2.5 py-0.5`}>
                    {card.badge.text}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {card.value}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {card.description}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">No metrics selected. Use the "Customize Metrics" dropdown to select metrics to display.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Recent Tickets</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/tickets">View All</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No tickets found. Create your first ticket to get started.</p>
            <Button className="mt-4" asChild>
              <Link to="/tickets/new">Create Ticket</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/tickets/${ticket.id}`} className="font-medium text-gray-900 hover:text-primary">
                      {ticket.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'pending' ? 'bg-purple-100 text-purple-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Ticket Volume Trend (30 Days)</h3>
          <div style={{ height: '250px' }}>
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Line 
                data={ticketTrendsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Top Ticket Categories</h3>
          <div style={{ height: '250px' }}>
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Doughnut 
                data={categoryChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Knowledge Base Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Knowledge Base Articles</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/knowledge-base">View All</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading articles...</p>
          </div>
        ) : kbArticles.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No knowledge base articles found.</p>
            <Button className="mt-4" asChild>
              <Link to="/knowledge-base/new">Create Article</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {kbArticles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/knowledge-base/article/${article.id}`} className="font-medium text-gray-900 hover:text-primary">
                      {article.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{article.content.substring(0, 120)}...</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      article.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Button asChild>
              <Link to="/tickets/new">Create Ticket</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/problems/new">Log Problem</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/changes/new">Request Change</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/improvements/new">Propose Improvement</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/knowledge-base/new">Create KB Article</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">View Reports</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">System Status</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Deskwise ITSM Platform</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Ticket System</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Knowledge Base</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Problem Management</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Change Management</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Improvement Management</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
