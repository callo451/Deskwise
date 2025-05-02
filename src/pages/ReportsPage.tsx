import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { checkSupabaseConnection } from '../lib/supabase';
import { format } from 'date-fns';
import {
  getTicketMetrics,
  getTicketTrends,
  getCategoryDistribution,
  getKnowledgeBaseMetrics,
  getAssigneePerformance,
  getSLAComplianceByPriority,
  getFiltersData,
  getProblemsData,
  getImprovementsData,
  getChangesData,
  ReportFilter,
  ProblemsData,
  ImprovementsData,
  ChangesData,
  TicketTrend,
  CategoryDistribution,
  AssigneePerformance,
  KnowledgeBaseMetrics
} from '../services/reportService';
import ReportFilters from '../components/reports/ReportFilters';
import ReportChart from '../components/reports/ReportChart';
import MetricCard from '../components/reports/MetricCard';
import ReportTable from '../components/reports/ReportTable';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  console.log('ReportsPage render - activeTab:', activeTab, 'filters:', filters);
  
  // Filter data
  const [filterData, setFilterData] = useState<{
    categories: { id: string; name: string }[];
    priorities: { id: string; name: string }[];
    statuses: { id: string; name: string }[];
    assignees: { id: string; name: string }[];
    queues: { id: string; name: string }[];
  }>({
    categories: [],
    priorities: [],
    statuses: [],
    assignees: [],
    queues: []
  });
  
  // Ticket metrics
  const [ticketMetrics, setTicketMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    slaCompliance: 0,
    firstResponseTime: 0
  });
  
  // Ticket trends
  const [ticketTrends, setTicketTrends] = useState<TicketTrend[]>([]);
  
  // Category distribution
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  
  // KB metrics
  const [kbMetrics, setKbMetrics] = useState<KnowledgeBaseMetrics>({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0,
    avgFeedbackScore: 0,
    mostViewedArticles: [],
    articlesByCategory: []
  });
  
  // Assignee performance
  const [assigneePerformance, setAssigneePerformance] = useState<AssigneePerformance[]>([]);
  
  // SLA compliance by priority
  const [slaByPriority, setSlaByPriority] = useState<{priority: string; compliance: number}[]>([]);
  
  // New state variables for the new tabs with proper types
  const [problemsData, setProblemsData] = useState<ProblemsData>({
    recurring: [],
    unresolved: [],
    byCategory: []
  });
  
  const [improvementsData, setImprovementsData] = useState<ImprovementsData>({
    suggestions: [],
    implemented: [],
    pending: []
  });
  
  const [changesData, setChangesData] = useState<ChangesData>({
    recent: [],
    upcoming: [],
    byImpact: []
  });

  useEffect(() => {
    console.log('ReportsPage loadReportData useEffect triggered', activeTab, filters);
    const loadReportData = async () => {
      console.log('Invoking loadReportData - starting data load for tab:', activeTab);
      console.log('Starting to load report data for tab:', activeTab);
      setIsLoading(true);
      
      // Safety timeout to ensure loading state is reset after 10 seconds
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout triggered - forcing loading state to false');
        setIsLoading(false);
      }, 10000);
      
      // Check Supabase connection before attempting to load data
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.error('Supabase connection check failed - cannot load report data');
        setIsLoading(false);
        clearTimeout(safetyTimeout);
        return;
      }
      
      try {
        // Load data based on active tab
        if (activeTab === 0) {
          console.log('Loading Ticket Overview tab data');
          // Ticket Overview tab
          try {
            const metrics = await getTicketMetrics(filters);
            console.log('Ticket metrics loaded:', metrics);
            setTicketMetrics(metrics);
            
            const trends = await getTicketTrends(filters);
            console.log('Ticket trends loaded');
            setTicketTrends(trends);
            
            const categories = await getCategoryDistribution(filters);
            console.log('Category distribution loaded');
            setCategoryDistribution(categories);
            
            const slaData = await getSLAComplianceByPriority(filters);
            console.log('SLA data loaded');
            setSlaByPriority(slaData);
          } catch (error) {
            console.error('Error in Ticket Overview tab:', error);
            // Set defaults
            setTicketMetrics({
              totalTickets: 0,
              openTickets: 0,
              resolvedTickets: 0,
              avgResolutionTime: 0,
              slaCompliance: 0,
              firstResponseTime: 0
            });
            setTicketTrends([]);
            setCategoryDistribution([]);
            setSlaByPriority([]);
          }
        } else if (activeTab === 1) {
          console.log('Loading Knowledge Base tab data');
          // Knowledge Base tab
          try {
            const kbData = await getKnowledgeBaseMetrics(filters);
            console.log('KB metrics loaded');
            setKbMetrics(kbData);
          } catch (error) {
            console.error('Error in Knowledge Base tab:', error);
            setKbMetrics({
              totalArticles: 0,
              publishedArticles: 0,
              totalViews: 0,
              avgFeedbackScore: 0,
              mostViewedArticles: [],
              articlesByCategory: []
            });
          }
        } else if (activeTab === 2) {
          console.log('Loading Performance tab data');
          // Performance tab
          try {
            const performance = await getAssigneePerformance(filters);
            console.log('Performance data loaded');
            setAssigneePerformance(performance);
            
            const slaData = await getSLAComplianceByPriority(filters);
            console.log('SLA data loaded');
            setSlaByPriority(slaData);
          } catch (error) {
            console.error('Error in Performance tab:', error);
            setAssigneePerformance([]);
            setSlaByPriority([]);
          }
        } else if (activeTab === 3) {
          console.log('Loading Problems tab data');
          // Problems tab - Fetch real data from API
          try {
            const problemsData = await getProblemsData(filters);
            console.log('Problems data loaded');
            setProblemsData(problemsData);
          } catch (error) {
            console.error('Error fetching problems data:', error);
            // Set default empty data in case of error
            setProblemsData({
              recurring: [],
              unresolved: [],
              byCategory: []
            });
          }
        } else if (activeTab === 4) {
          console.log('Loading Improvements tab data');
          // Improvements tab - Fetch real data from API
          try {
            const improvementsData = await getImprovementsData(filters);
            console.log('Improvements data loaded');
            setImprovementsData(improvementsData);
          } catch (error) {
            console.error('Error fetching improvements data:', error);
            // Set default empty data in case of error
            setImprovementsData({
              suggestions: [],
              implemented: [],
              pending: []
            });
          }
        } else if (activeTab === 5) {
          console.log('Loading Changes tab data');
          // Changes tab - Fetch real data from API
          try {
            const changesData = await getChangesData(filters);
            console.log('Changes data loaded');
            setChangesData(changesData);
          } catch (error) {
            console.error('Error fetching changes data:', error);
            // Set default empty data in case of error
            setChangesData({
              recent: [],
              upcoming: [],
              byImpact: []
            });
          }
        }
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        console.log('Finished loading report data, setting isLoading to false');
        clearTimeout(safetyTimeout); // Clear the safety timeout
        setIsLoading(false);
      }
    };
    
    loadReportData();
  }, [activeTab, filters]);
  
  const handleFilterChange = (newFilters: ReportFilter) => {
    setFilters(newFilters);
  };
  
  // Prepare chart data for ticket trends
  const ticketTrendsChartData = {
    labels: ticketTrends.map((trend: any) => format(new Date(trend.date), 'MMM dd')),
    datasets: [
      {
        label: 'Tickets Created',
        data: ticketTrends.map((trend: any) => trend.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  };
  
  // Prepare chart data for category distribution
  const categoryChartData = {
    labels: categoryDistribution.map((cat: any) => cat.category),
    datasets: [
      {
        label: 'Tickets by Category',
        data: categoryDistribution.map((cat: any) => cat.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for SLA compliance by priority
  const slaChartData = {
    labels: slaByPriority.map((item: any) => item.priority),
    datasets: [
      {
        label: 'SLA Compliance (%)',
        data: slaByPriority.map((item: any) => item.compliance),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for KB articles by category
  const kbCategoryChartData = {
    labels: kbMetrics.articlesByCategory.map((cat: any) => cat.category),
    datasets: [
      {
        label: 'Articles by Category',
        data: kbMetrics.articlesByCategory.map((cat: any) => cat.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => window.print()}
          >
            Print Report
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => {
              // Reset filters to default (last 30 days)
              setFilters({
                startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                endDate: new Date()
              });
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      <Tab.Group onChange={setActiveTab}>
        <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-xl mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Ticket Overview
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Knowledge Base
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Performance Metrics
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Problems
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Improvements
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary ring-primary ring-opacity-60',
                selected
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )
            }
          >
            Changes
          </Tab>
        </Tab.List>
        
        <ReportFilters
          onFilterChange={handleFilterChange}
          categories={filterData.categories}
          priorities={filterData.priorities}
          statuses={filterData.statuses}
          assignees={filterData.assignees}
          queues={filterData.queues}
        />
        
        <Tab.Panels>
          {/* Ticket Overview Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <MetricCard
                    title="Total Tickets"
                    value={ticketMetrics.totalTickets}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    color="blue"
                  />
                  <MetricCard
                    title="Open Tickets"
                    value={ticketMetrics.openTickets}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                    color="yellow"
                  />
                  <MetricCard
                    title="Resolved Tickets"
                    value={ticketMetrics.resolvedTickets}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    color="green"
                  />
                  <MetricCard
                    title="SLA Compliance"
                    value={`${ticketMetrics.slaCompliance.toFixed(1)}%`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    color="indigo"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <MetricCard
                      title="Avg Resolution Time"
                      value={`${ticketMetrics.avgResolutionTime.toFixed(1)} hours`}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                      color="purple"
                    />
                  </div>
                  <div>
                    <MetricCard
                      title="Avg First Response Time"
                      value={`${ticketMetrics.firstResponseTime.toFixed(1)} hours`}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>}
                      color="red"
                    />
                  </div>
                </div>
                
                <ReportChart
                  title="Ticket Volume Trend"
                  type="line"
                  data={ticketTrendsChartData}
                  height={300}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ReportChart
                    title="Tickets by Category"
                    type="pie"
                    data={categoryChartData}
                    height={300}
                  />
                  
                  <ReportChart
                    title="SLA Compliance by Priority"
                    type="bar"
                    data={slaChartData}
                    height={300}
                  />
                </div>
                
                <ReportTable
                  title="SLA Compliance Details"
                  columns={[
                    { key: 'priority', header: 'Priority' },
                    { key: 'total', header: 'Total Tickets' },
                    { key: 'met', header: 'SLA Met' },
                    { 
                      key: 'compliance', 
                      header: 'Compliance %',
                      render: (value) => `${value.toFixed(1)}%`
                    },
                  ]}
                  data={slaByPriority}
                  exportable={true}
                />
              </>
            )}
          </Tab.Panel>
          
          {/* Knowledge Base Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <MetricCard
                    title="Total Articles"
                    value={kbMetrics.totalArticles}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>}
                    color="blue"
                  />
                  <MetricCard
                    title="Published Articles"
                    value={kbMetrics.publishedArticles}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>}
                    color="green"
                  />
                  <MetricCard
                    title="Total Views"
                    value={kbMetrics.totalViews}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    color="indigo"
                  />
                  <MetricCard
                    title="Feedback Score"
                    value={`${kbMetrics.avgFeedbackScore.toFixed(1)}%`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                    color="yellow"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ReportChart
                    title="Articles by Category"
                    type="doughnut"
                    data={kbCategoryChartData}
                    height={300}
                  />
                  
                  <ReportTable
                    title="Most Viewed Articles"
                    columns={[
                      { key: 'title', header: 'Article Title' },
                      { key: 'views', header: 'Views' },
                    ]}
                    data={kbMetrics.mostViewedArticles}
                    exportable={true}
                    pagination={false}
                  />
                </div>
              </>
            )}
          </Tab.Panel>
          
          {/* Performance Metrics Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <ReportTable
                  title="Technician Performance"
                  columns={[
                    { key: 'assignee', header: 'Technician' },
                    { key: 'ticketsResolved', header: 'Tickets Resolved' },
                    { 
                      key: 'avgResolutionTime', 
                      header: 'Avg Resolution Time',
                      render: (value) => `${value.toFixed(1)} hours`
                    },
                    { 
                      key: 'slaCompliance', 
                      header: 'SLA Compliance',
                      render: (value) => `${value.toFixed(1)}%`
                    },
                  ]}
                  data={assigneePerformance}
                  exportable={true}
                />
                
                <ReportChart
                  title="SLA Compliance by Priority"
                  type="bar"
                  data={slaChartData}
                  height={300}
                />
              </>
            )}
          </Tab.Panel>
          
          {/* Problems Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="Recurring Issues"
                    value={problemsData.recurring.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                    color="red"
                  />
                  <MetricCard
                    title="Unresolved Problems"
                    value={problemsData.unresolved.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                    color="orange"
                  />
                  <MetricCard
                    title="Problem Categories"
                    value={problemsData.byCategory.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h3a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    color="blue"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ReportTable
                    title="Most Recurring Issues"
                    columns={[
                      { key: 'title', header: 'Issue' },
                      { key: 'count', header: 'Occurrences' },
                      { key: 'category', header: 'Category' }
                    ]}
                    data={problemsData.recurring}
                    exportable={true}
                  />
                  
                  <ReportTable
                    title="Unresolved Problems"
                    columns={[
                      { key: 'title', header: 'Problem' },
                      { key: 'count', header: 'Affected Users' },
                      { key: 'priority', header: 'Priority' },
                      { 
                        key: 'age', 
                        header: 'Age (days)',
                        render: (value) => `${value} days`
                      }
                    ]}
                    data={problemsData.unresolved}
                    exportable={true}
                  />
                </div>
                
                <ReportChart
                  title="Problems by Category"
                  type="pie"
                  data={{
                    labels: problemsData.byCategory.map((cat: any) => cat.category),
                    datasets: [
                      {
                        label: 'Problems by Category',
                        data: problemsData.byCategory.map((cat: any) => cat.count),
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
                  }}
                  height={300}
                />
              </>
            )}
          </Tab.Panel>
          
          {/* Improvements Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="Improvement Suggestions"
                    value={improvementsData.suggestions.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    color="indigo"
                  />
                  <MetricCard
                    title="Implemented Improvements"
                    value={improvementsData.implemented.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    color="green"
                  />
                  <MetricCard
                    title="Pending Improvements"
                    value={improvementsData.pending.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                    color="yellow"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ReportTable
                    title="Top Improvement Suggestions"
                    columns={[
                      { key: 'title', header: 'Suggestion' },
                      { key: 'votes', header: 'Votes' },
                      { key: 'source', header: 'Source' }
                    ]}
                    data={improvementsData.suggestions}
                    exportable={true}
                  />
                  
                  <ReportTable
                    title="Recently Implemented"
                    columns={[
                      { key: 'title', header: 'Improvement' },
                      { key: 'date', header: 'Date' },
                      { key: 'impact', header: 'Impact' }
                    ]}
                    data={improvementsData.implemented}
                    exportable={true}
                  />
                </div>
                
                <ReportTable
                  title="Pending Improvements"
                  columns={[
                    { key: 'title', header: 'Improvement' },
                    { key: 'status', header: 'Status' },
                    { key: 'eta', header: 'ETA' }
                  ]}
                  data={improvementsData.pending}
                  exportable={true}
                />
              </>
            )}
          </Tab.Panel>
          
          {/* Changes Panel */}
          <Tab.Panel>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="Recent Changes"
                    value={changesData.recent.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
                    color="blue"
                  />
                  <MetricCard
                    title="Upcoming Changes"
                    value={changesData.upcoming.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    color="purple"
                  />
                  <MetricCard
                    title="High Impact Changes"
                    value={changesData.byImpact.find((item: any) => item.impact === 'High')?.count || 0}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>}
                    color="red"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <ReportTable
                    title="Recent Changes"
                    columns={[
                      { key: 'title', header: 'Change' },
                      { key: 'date', header: 'Date' },
                      { key: 'author', header: 'Author' }
                    ]}
                    data={changesData.recent}
                    exportable={true}
                  />
                  
                  <ReportTable
                    title="Upcoming Changes"
                    columns={[
                      { key: 'title', header: 'Change' },
                      { key: 'date', header: 'Date' },
                      { key: 'type', header: 'Type' }
                    ]}
                    data={changesData.upcoming}
                    exportable={true}
                  />
                </div>
                
                <ReportChart
                  title="Changes by Impact Level"
                  type="bar"
                  data={{
                    labels: changesData.byImpact.map((item: any) => item.impact),
                    datasets: [
                      {
                        label: 'Number of Changes',
                        data: changesData.byImpact.map((item: any) => item.count),
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(255, 206, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                        ],
                        borderWidth: 1
                      }
                    ]
                  }}
                  height={300}
                />
              </>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ReportsPage;
