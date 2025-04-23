import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getQueues, QueueItem } from '../../services/queueService';
import { cn } from '../../lib/utils';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, roles, children, defaultOpen = false }) => {
  const location = useLocation();
  const { userDetails } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Check if user has required role
  if (roles && userDetails && !roles.includes(userDetails.role)) {
    return null;
  }

  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  // If there are children, render a collapsible section instead of a direct link
  if (children) {
    return (
      <div>
        <div 
          className={cn(
            'flex items-center px-4 py-2 text-sm rounded-md transition-colors cursor-pointer',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="mr-3">{icon}</span>
          <span className="flex-1">{label}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  }
  
  // Otherwise, render a regular link
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
};

// Section header component for sidebar categories
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 pt-5 pb-2">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </h3>
  </div>
);

const Sidebar: React.FC = () => {
  const { userDetails } = useAuth();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    if (userDetails) {
      fetchQueues();
    }
  }, [userDetails]);
  
  const fetchQueues = async () => {
    setIsLoadingQueues(true);
    try {
      const data = await getQueues();
      // Only show active queues
      setQueues(data.filter(queue => queue.is_active));
    } catch (err) {
      console.error('Error fetching queues:', err);
    } finally {
      setIsLoadingQueues(false);
    }
  };
  
  if (!userDetails) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] flex flex-col overflow-y-auto fixed top-16 left-0 z-40">
      <nav className="flex-1 px-2 pt-0 space-y-1">
        {/* Main Navigation */}
        <SectionHeader title="Main" />
        <NavItem
          to="/dashboard"
          label="Dashboard"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
        />
        
        <NavItem
          to="/tickets"
          label="Tickets"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
        />
        
        {/* ITIL Service Management Modules */}
        <SectionHeader title="Service Management" />
        <NavItem
          to="/problems"
          label="Problem Management"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
          roles={['technician', 'manager', 'admin']}
        />
        
        <NavItem
          to="/changes"
          label="Change Management"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
          roles={['technician', 'manager', 'admin']}
        />
        
        <NavItem
          to="/improvements"
          label="Improvement Management"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>}
          roles={['manager', 'admin']}
        />
        
        <NavItem
          to="/services"
          label="Service Catalog"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>}
        />
        
        {/* Knowledge & Information */}
        <SectionHeader title="Knowledge" />
        <NavItem
          to="/knowledge-base"
          label="Knowledge Base"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>}
          defaultOpen={location.pathname.startsWith('/knowledge-base')}
        >
          <Link
            to="/knowledge-base"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/knowledge-base'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Browse Articles
          </Link>
          <Link
            to="/knowledge-base/new"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/knowledge-base/new'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Create Article
          </Link>

        </NavItem>
        
        {/* Admin and Manager only sections */}
        <SectionHeader title="Administration" />
        <NavItem
          to="/queues"
          label="Queues"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          defaultOpen={location.pathname.startsWith('/queues/')}
        >
          {isLoadingQueues ? (
            <div className="text-sm text-gray-500 py-2 px-4">Loading queues...</div>
          ) : queues.length === 0 ? (
            <div className="text-sm text-gray-500 py-2 px-4">No queues available</div>
          ) : (
            queues.map(queue => (
              <Link
                key={queue.id}
                to={`/queues/${queue.id}`}
                className={cn(
                  'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
                  location.pathname === `/queues/${queue.id}`
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                {queue.name}
              </Link>
            ))
          )}
        </NavItem>
        
        <NavItem
          to="/reports"
          label="Reports & Analytics"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
          defaultOpen={location.pathname.startsWith('/reports')}
          roles={['manager', 'admin']}
        >
          <Link
            to="/reports"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/reports' && !location.search
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Dashboard
          </Link>
          <Link
            to="/reports?tab=tickets"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/reports' && location.search.includes('tab=tickets')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Ticket Reports
          </Link>
          <Link
            to="/reports?tab=kb"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/reports' && location.search.includes('tab=kb')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Knowledge Base Reports
          </Link>
          <Link
            to="/reports?tab=performance"
            className={cn(
              'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              location.pathname === '/reports' && location.search.includes('tab=performance')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            Performance Metrics
          </Link>
        </NavItem>
        
        <NavItem
          to="/settings"
          label="Settings"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>}
          roles={['admin']}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Deskwise ITSM Platform
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
