import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemById, updateProblem } from '../../services/problemService';
import { getTicketCategories } from '../../services/settingsService';
import { getServices } from '../../services/serviceService';
import { fetchUsers } from '../../services/userService';
import { Problem, ProblemStatus, ProblemPriority, ProblemImpact, ProblemUrgency } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

// Import subcomponents
import ProblemDetailHeader from './ProblemDetailHeader';
import ProblemDetailTabs from './ProblemDetailTabs';
import ProblemDetailView from './ProblemDetailView';
import ProblemDetailForm from './ProblemDetailForm';
import ProblemWorkaround from './ProblemWorkaround';
import ProblemSolution from './ProblemSolution';
import ProblemRelatedTickets from './ProblemRelatedTickets';
import ProblemHistory from './ProblemHistory';

// Import UI components
import { Button } from '../ui/Button';
import { 
  ExclamationCircleIcon, 
  ArrowPathIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface ProblemDetailProps {
  onBack?: () => void;
}

interface ProblemWithDetails extends Problem {
  created_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  problem_history?: any[];
  related_tickets?: {
    ticket_id: string;
    tickets?: {
      id: string;
      title: string;
      status: string;
      priority: string;
      created_at: string;
    };
  }[];
}

const ProblemDetail: React.FC<ProblemDetailProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  
  const [problem, setProblem] = useState<ProblemWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'tickets' | 'workaround' | 'solution'>('details');
  
  // Settings state
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Edit form state
  const [editedProblem, setEditedProblem] = useState<{
    title: string;
    description: string;
    status: ProblemStatus;
    priority: ProblemPriority;
    impact: ProblemImpact;
    urgency: ProblemUrgency;
    symptoms: string;
    root_cause: string | null;
    workaround: string | null;
    permanent_solution: string | null;
    category_id: string | null;
    service_id: string | null;
    assigned_to: string | null;
    known_error_db_entry: boolean;
  }>({
    title: '',
    description: '',
    status: 'identified',
    priority: 'medium',
    impact: 'medium',
    urgency: 'medium',
    symptoms: '',
    root_cause: null,
    workaround: null,
    permanent_solution: null,
    category_id: null,
    service_id: null,
    assigned_to: null,
    known_error_db_entry: false,
  });

  useEffect(() => {
    if (id) {
      fetchProblem();
      fetchSettings();
    }
  }, [id]);
  
  const fetchSettings = async () => {
    try {
      const [categoriesData, servicesData] = await Promise.all([
        getTicketCategories(),
        getServices()
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      
      // Fetch users for assignment dropdown
      if (userDetails?.tenant_id) {
        const usersData = await fetchUsers(userDetails.tenant_id);
        // Filter to only show active users that can be assigned problems (technicians, managers, admins)
        const assignableUsers = usersData.filter(user => 
          user.is_active && ['technician', 'manager', 'admin'].includes(user.role)
        );
        setUsers(assignableUsers);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    if (problem) {
      setEditedProblem({
        title: problem.title,
        description: problem.description,
        status: problem.status,
        priority: problem.priority,
        impact: problem.impact,
        urgency: problem.urgency,
        symptoms: problem.symptoms || '',
        root_cause: problem.root_cause,
        workaround: problem.workaround,
        permanent_solution: problem.permanent_solution,
        category_id: problem.category_id,
        service_id: problem.service_id,
        assigned_to: problem.assigned_to,
        known_error_db_entry: problem.known_error_db_entry,
      });
    }
  }, [problem]);

  const fetchProblem = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getProblemById(id);
      setProblem(data as ProblemWithDetails);
    } catch (err: any) {
      console.error('Error fetching problem:', err);
      setError(err.message || 'Failed to fetch problem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditedProblem(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedProblem = await updateProblem(id, editedProblem);
      setProblem(prev => prev ? { ...prev, ...updatedProblem } as ProblemWithDetails : null);
      setIsEditing(false);
      fetchProblem(); // Refresh to get updated history
    } catch (err: any) {
      console.error('Error updating problem:', err);
      setError(err.message || 'Failed to update problem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/problems');
    }
  };

  // Check if user can edit the problem
  const canEdit = userDetails && (
    userDetails.role === 'admin' ||
    userDetails.role === 'manager' ||
    userDetails.role === 'technician' ||
    (problem && problem.created_by === userDetails.id)
  );

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading problem information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg shadow">
        <div className="text-red-500 text-center mb-4">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto" />
          <p className="font-medium text-lg mt-2">{error}</p>
        </div>
        <Button className="flex items-center" onClick={fetchProblem}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg shadow">
        <InformationCircleIcon className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-600 mb-4">Problem not found or has been deleted</p>
        <Button className="flex items-center" onClick={handleBack}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Back to Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with problem number and actions */}
      <ProblemDetailHeader
        problem={problem}
        isEditing={isEditing}
        canEdit={canEdit}
        isSaving={isSaving}
        onBack={handleBack}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => {
          setIsEditing(false);
          // Reset form to current problem state
          if (problem) {
            setEditedProblem({
              title: problem.title,
              description: problem.description,
              status: problem.status,
              priority: problem.priority,
              impact: problem.impact,
              urgency: problem.urgency,
              symptoms: problem.symptoms || '',
              root_cause: problem.root_cause,
              workaround: problem.workaround,
              permanent_solution: problem.permanent_solution,
              category_id: problem.category_id,
              service_id: problem.service_id,
              assigned_to: problem.assigned_to,
              known_error_db_entry: problem.known_error_db_entry,
            });
          }
        }}
      />
      
      {/* Tab navigation */}
      <ProblemDetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Main content area */}
      <div className="p-6">
        {activeTab === 'details' && (
          isEditing ? (
            <ProblemDetailForm
              problem={problem}
              editedProblem={editedProblem}
              users={users}
              services={services}
              categories={categories}
              onEditChange={handleEditChange}
            />
          ) : (
            <ProblemDetailView problem={problem} />
          )
        )}
        
        {activeTab === 'workaround' && (
          <ProblemWorkaround
            problem={problem}
            isEditing={isEditing}
            editedProblem={editedProblem}
            onEditChange={handleEditChange}
          />
        )}
        
        {activeTab === 'solution' && (
          <ProblemSolution
            problem={problem}
            isEditing={isEditing}
            editedProblem={editedProblem}
            onEditChange={handleEditChange}
          />
        )}
        
        {activeTab === 'tickets' && (
          <ProblemRelatedTickets
            problem={problem}
            onTicketsChanged={fetchProblem}
          />
        )}
        
        {activeTab === 'history' && (
          <ProblemHistory problem={problem} />
        )}
      </div>
    </div>
  );
};

export default ProblemDetail;
