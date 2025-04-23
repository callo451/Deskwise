import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { 
  getTicketMetrics, 
  getTicketTrends, 
  getCategoryDistribution, 
  getKnowledgeBaseMetrics, 
  getAssigneePerformance, 
  getSLAComplianceByPriority,
  getFiltersData,
  ReportFilter
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
  
  // Filter data
  const [filterData, setFilterData] = useState({
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
  const [ticketTrends, setTicketTrends] = useState([]);
  
  // Category distribution
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  
  // KB metrics
  const [kbMetrics, setKbMetrics] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0,
    avgFeedbackScore: 0,
    mostViewedArticles: [],
    articlesByCategory: []
  });
  
  // Assignee performance
  const [assigneePerformance, setAssigneePerformance] = useState([]);
  
  // SLA compliance by priority
  const [slaByPriority, setSlaByPriority] = useState([]);
  
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const data = await getFiltersData();
        setFilterData(data);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    
    loadFilterData();
  }, []);
  
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        // Load data based on active tab
        if (activeTab === 0) {
          // Ticket Overview tab
          const metrics = await getTicketMetrics(filters);
          setTicketMetrics(metrics);
          
          const trends = await getTicketTrends(filters);
          setTicketTrends(trends);
          
          const categories = await getCategoryDistribution(filters);
          setCategoryDistribution(categories);
          
          const slaData = await getSLAComplianceByPriority(filters);
          setSlaByPriority(slaData);
        } else if (activeTab === 1) {
          // Knowledge Base tab
          const kbData = await getKnowledgeBaseMetrics(filters);
          setKbMetrics(kbData);
        } else if (activeTab === 2) {
          // Performance tab
          const performance = await getAssigneePerformance(filters);
          setAssigneePerformance(performance);
          
          const slaData = await getSLAComplianceByPriority(filters);
          setSlaByPriority(slaData);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
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
      
      <ReportFilters
        onFilterChange={handleFilterChange}
        categories={filterData.categories}
        priorities={filterData.priorities}
        statuses={filterData.statuses}
        assignees={filterData.assignees}
        queues={filterData.queues}
      />
      
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
        </Tab.List>
        
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
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
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
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                    color="indigo"
                  />
                  <MetricCard
                    title="Feedback Score"
                    value={`${kbMetrics.avgFeedbackScore.toFixed(1)}%`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
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
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ReportsPage;
