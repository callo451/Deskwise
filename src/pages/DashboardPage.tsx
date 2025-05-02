import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Ticket } from '../types/database';
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
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import StyledActionButton from '../components/ui/StyledActionButton';

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
  const [ticketsByDay, setTicketsByDay] = useState<{date: string; count: number}[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{category: string; count: number}[]>([]);
  const [slaCompliance, setSlaCompliance] = useState<number>(100);
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
        // Ensure compliance is 100 if no tickets have SLAs
        const compliance = ticketsWithSLA.length > 0 ? (compliantTickets.length / ticketsWithSLA.length) * 100 : 100;
        setSlaCompliance(compliance);

        // Calculate average response time (example logic - adjust as needed)
        const ticketsWithResponse = allTickets.filter(ticket => ticket.responded_at && ticket.created_at);
        if (ticketsWithResponse.length > 0) {
          const totalResponseMillis = ticketsWithResponse.reduce((sum, ticket) => {
            // Ensure dates are valid before calculating difference
            const createdAt = new Date(ticket.created_at as string).getTime();
            const respondedAt = new Date(ticket.responded_at as string).getTime();
            if (!isNaN(createdAt) && !isNaN(respondedAt) && respondedAt >= createdAt) {
              return sum + (respondedAt - createdAt);
            }
            return sum;
          }, 0);
          // Convert total milliseconds to average hours
          const avgMillis = totalResponseMillis / ticketsWithResponse.length;
          setAvgResponseTime(avgMillis / (1000 * 60 * 60)); // Convert ms to hours
        } else {
          setAvgResponseTime(0); // Set to 0 if no tickets have response times
        }

        // Calculate tickets per day for the last 30 days
        const dailyCounts: Record<string, number> = {}; // Use Record for better type safety
        for (let i = 29; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          dailyCounts[date] = 0;
        }
        allTickets.forEach(ticket => {
          const date = format(new Date(ticket.created_at), 'yyyy-MM-dd');
          if (dailyCounts.hasOwnProperty(date)) {
            dailyCounts[date]++;
          }
        });
        setTicketsByDay(Object.entries(dailyCounts).map(([date, count]) => ({ date, count })));

        // Calculate ticket distribution by category
        const categoryCounts: Record<string, number> = {}; // Use Record for better type safety
        allTickets.forEach(ticket => {
          const category = ticket.category || 'Uncategorized'; // Handle potential null/undefined category
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        setCategoryDistribution(
          Object.entries(categoryCounts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count) // Sort by count descending
        );

        // Fetch other metrics (KB views, Change success etc. - Placeholder logic)
        // These would typically involve separate fetches or calculations based on your data model
        setKbViews(Math.floor(Math.random() * 500) + 50); // Example random data
        setKbHelpfulRate(Math.random() * 15 + 80); // Example random data (80-95%)
        setChangeSuccess(Math.random() * 10 + 90); // Example random data (90-100%)
        setProblemResolution(Math.random() * 20 + 75); // Example random data (75-95%)
        setImprovementProgress(Math.random() * 40 + 40); // Example random data (40-80%)

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data preparation
  const lineChartData = {
    labels: ticketsByDay.map(d => d.date),
    datasets: [
      {
        label: 'Tickets Created Per Day',
        data: ticketsByDay.map(d => d.count),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const barChartData = {
    labels: categoryDistribution.map(c => c.category),
    datasets: [
      {
        label: 'Ticket Distribution by Category',
        data: categoryDistribution.map(c => c.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutChartData = {
    labels: ['SLA Met', 'SLA Breached'],
    datasets: [
      {
        label: 'SLA Compliance Overview',
        data: [slaCompliance, 100 - slaCompliance],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 bg-red-100 p-4 rounded">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | DeskWise ITSM</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome, {userDetails?.first_name || userDetails?.email || 'User'}! Here's your IT service summary.</p>
          </div>
          {/* Metrics Customization Dropdown - Positioned to the right */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowMetricsDropdown(!showMetricsDropdown)}
              className="flex items-center"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Customize Metrics
            </Button>
            {showMetricsDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {metricCards.map(card => (
                    <label key={card.id} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        className="mr-2 form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        checked={card.isEnabled}
                        onChange={() => toggleMetricCard(card.id)}
                      />
                      {card.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links/Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4"> 
            <StyledActionButton to="/tickets/new" text="Create New Ticket" />
            <StyledActionButton to="/knowledge-base/new" text="Add KB Article" />
            <StyledActionButton to="/reports" text="View Reports" />
            {/* Add more actions as needed */}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {visibleMetricCards.map(card => (
            <div key={card.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-700">{card.title}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-500 mb-3">{card.description}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${card.badge.color}-100 text-${card.badge.color}-800`}>
                {card.badge.text}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Ticket Creation Trend (Last 30 Days)</h3>
            <div style={{ height: '300px' }}> 
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Ticket Distribution by Category</h3>
            <div style={{ height: '300px' }}> 
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }} />
            </div>
          </div>
        </div>

        {/* SLA and Other Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* SLA Compliance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">SLA Compliance</h3>
            <div style={{ height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Recent Activity Feed (Placeholder) */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
            <ul className="space-y-3">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <li key={ticket.id} className="flex items-center justify-between text-sm">
                    <Link to={`/tickets/${ticket.id}`} className="text-indigo-600 hover:underline">
                      Ticket #{ticket.id}: {ticket.title || 'No Title'}
                    </Link>
                    <span className="text-gray-500">{format(new Date(ticket.created_at), 'MMM d, h:mm a')}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No recent ticket activity.</p>
              )}
              {/* Add other activities like KB updates, changes etc. here */}
              <li className="text-center pt-2">
                 <Link to="/tickets" className="text-sm text-indigo-600 hover:underline font-medium">
                   View All Tickets
                 </Link>
               </li>
            </ul>
          </div>
        </div>

      </div>
    </>
  );
};

export default DashboardPage;
