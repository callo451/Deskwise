export type UserRole = 'user' | 'technician' | 'manager' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// Problem Management Types
export type ProblemStatus = 'identified' | 'investigating' | 'diagnosed' | 'known_error' | 'resolved' | 'closed';
export type ProblemPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProblemImpact = 'low' | 'medium' | 'high' | 'critical';
export type ProblemUrgency = 'low' | 'medium' | 'high' | 'critical';

// Change Management Types
export type ChangeStatus = 'draft' | 'submitted' | 'assessment' | 'approval' | 'scheduled' | 'implementation' | 'review' | 'closed' | 'rejected' | 'cancelled';
export type ChangeType = 'standard' | 'normal' | 'emergency' | 'pre-approved';
export type ChangeRiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type ChangeImpact = 'individual' | 'department' | 'multiple_departments' | 'organization_wide';

// Improvement Management Types
export type ImprovementStatus = 'proposed' | 'under_review' | 'approved' | 'in_progress' | 'implemented' | 'closed' | 'rejected';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';
export type ImprovementCategory = 'process' | 'service' | 'technology' | 'people' | 'other';

export interface TicketStatusSettings {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketPrioritySettings {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_id?: string | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  queue_id: string | null;
  service_id: string | null;
  status_id: string;
  priority_id: string;
  category_id: string | null;
  sla_id: string | null;
  response_deadline: string | null;
  resolution_deadline: string | null;
  first_response_time: string | null;
  sla_status: string | null;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  tenant_id: string;
}

export interface Queue {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  category: string | null;
  category_id: string | null;
  tags: string[] | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseArticleView {
  id: string;
  article_id: string;
  user_id: string | null;
  viewed_at: string;
  tenant_id: string;
}

export interface KnowledgeBaseArticleFeedback {
  id: string;
  article_id: string;
  user_id: string | null;
  helpful: boolean;
  comment: string | null;
  created_at: string;
  tenant_id: string;
}

export interface TicketKnowledgeBaseLink {
  id: string;
  ticket_id: string;
  article_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

export interface SLA {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  response_time_minutes: number;
  resolution_time_minutes: number;
  priority: string;
  is_active: boolean;
  business_hours_only: boolean;
  escalation_time_minutes: number | null;
  escalation_user_id: string | null;
  escalation_group_id: string | null;
  notification_template: string | null;
  applies_to: {
    priorities: string[];
    categories: string[];
    services: string[];
  } | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  tenant_id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAMetric {
  id: string;
  tenant_id: string;
  ticket_id: string;
  sla_id: string;
  response_deadline: string | null;
  resolution_deadline: string | null;
  response_met: boolean | null;
  resolution_met: boolean | null;
  response_breach_time: string | null;
  resolution_breach_time: string | null;
  created_at: string;
  updated_at: string;
}

// Problem Management Interfaces
export interface Problem {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: ProblemPriority;
  impact: ProblemImpact;
  urgency: ProblemUrgency;
  root_cause: string | null;
  symptoms: string | null;
  workaround: string | null;
  permanent_solution: string | null;
  created_by: string;
  assigned_to: string | null;
  identified_date: string;
  resolved_date: string | null;
  closed_date: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  service_id: string | null;
  related_incidents: string[] | null;
  known_error_db_entry: boolean;
}

export interface ProblemHistory {
  id: string;
  problem_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  tenant_id: string;
}

export interface ProblemTicketLink {
  id: string;
  problem_id: string;
  ticket_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

// Change Management Interfaces
export interface Change {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  status: ChangeStatus;
  change_type: ChangeType;
  risk_level: ChangeRiskLevel;
  impact: ChangeImpact;
  justification: string;
  implementation_plan: string | null;
  test_plan: string | null;
  backout_plan: string | null;
  created_by: string;
  assigned_to: string | null;
  requested_by: string | null;
  approved_by: string[] | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  service_id: string | null;
  affected_services: string[] | null;
  affected_configuration_items: string[] | null;
  review_notes: string | null;
  implementation_notes: string | null;
}

export interface ChangeHistory {
  id: string;
  change_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  tenant_id: string;
}

export interface ChangeApproval {
  id: string;
  change_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface ChangeSchedule {
  id: string;
  change_id: string;
  scheduled_start: string;
  scheduled_end: string;
  maintenance_window: boolean;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface ChangeTicketLink {
  id: string;
  change_id: string;
  ticket_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

export interface ChangeProblemLink {
  id: string;
  change_id: string;
  problem_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

// Improvement Management Interfaces
export interface Improvement {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  status: ImprovementStatus;
  priority: ImprovementPriority;
  category: ImprovementCategory;
  benefits: string | null;
  resources_required: string | null;
  estimated_effort: string | null;
  estimated_cost: number | null;
  expected_roi: string | null;
  created_by: string;
  assigned_to: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approval_date: string | null;
  implementation_date: string | null;
  created_at: string;
  updated_at: string;
  service_id: string | null;
  process_affected: string | null;
  success_criteria: string | null;
  implementation_notes: string | null;
}

export interface ImprovementHistory {
  id: string;
  improvement_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  tenant_id: string;
}

export interface ImprovementTicketLink {
  id: string;
  improvement_id: string;
  ticket_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface Database {
  public: {
    Tables: {
      ticket_comments: {
        Row: TicketComment;
        Insert: Omit<TicketComment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TicketComment, 'id' | 'created_at' | 'updated_at'>>;
      };
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Ticket, 'id' | 'created_at' | 'updated_at'>>;
      };
      ticket_history: {
        Row: TicketHistory;
        Insert: Omit<TicketHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<TicketHistory, 'id' | 'created_at'>>;
      };
      queues: {
        Row: Queue;
        Insert: Omit<Queue, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Queue, 'id' | 'created_at' | 'updated_at'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;
      };
      knowledge_base_articles: {
        Row: KnowledgeBaseArticle;
        Insert: Omit<KnowledgeBaseArticle, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KnowledgeBaseArticle, 'id' | 'created_at' | 'updated_at'>>;
      };
      knowledge_base_categories: {
        Row: KnowledgeBaseCategory;
        Insert: Omit<KnowledgeBaseCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KnowledgeBaseCategory, 'id' | 'created_at' | 'updated_at'>>;
      };
      knowledge_base_article_views: {
        Row: KnowledgeBaseArticleView;
        Insert: Omit<KnowledgeBaseArticleView, 'id'>;
        Update: Partial<Omit<KnowledgeBaseArticleView, 'id'>>;
      };
      knowledge_base_article_feedback: {
        Row: KnowledgeBaseArticleFeedback;
        Insert: Omit<KnowledgeBaseArticleFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<KnowledgeBaseArticleFeedback, 'id' | 'created_at'>>;
      };
      ticket_knowledge_base_links: {
        Row: TicketKnowledgeBaseLink;
        Insert: Omit<TicketKnowledgeBaseLink, 'id' | 'created_at'>;
        Update: Partial<Omit<TicketKnowledgeBaseLink, 'id' | 'created_at'>>;
      };
      slas: {
        Row: SLA;
        Insert: Omit<SLA, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SLA, 'id' | 'created_at' | 'updated_at'>>;
      };
      business_hours: {
        Row: BusinessHours;
        Insert: Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>>;
      };
      holidays: {
        Row: Holiday;
        Insert: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>;
      };
      sla_metrics: {
        Row: SLAMetric;
        Insert: Omit<SLAMetric, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SLAMetric, 'id' | 'created_at' | 'updated_at'>>;
      };
      ticket_priorities: {
        Row: TicketPrioritySettings;
        Insert: Omit<TicketPrioritySettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TicketPrioritySettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      ticket_categories: {
        Row: TicketCategory;
        Insert: Omit<TicketCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TicketCategory, 'id' | 'created_at' | 'updated_at'>>;
      };
      ticket_statuses: {
        Row: TicketStatusSettings;
        Insert: Omit<TicketStatusSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TicketStatusSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      problems: {
        Row: Problem;
        Insert: Omit<Problem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Problem, 'id' | 'created_at' | 'updated_at'>>;
      };
      problem_history: {
        Row: ProblemHistory;
        Insert: Omit<ProblemHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<ProblemHistory, 'id' | 'created_at'>>;
      };
      problem_ticket_links: {
        Row: ProblemTicketLink;
        Insert: Omit<ProblemTicketLink, 'id' | 'created_at'>;
        Update: Partial<Omit<ProblemTicketLink, 'id' | 'created_at'>>;
      };
      changes: {
        Row: Change;
        Insert: Omit<Change, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Change, 'id' | 'created_at' | 'updated_at'>>;
      };
      change_history: {
        Row: ChangeHistory;
        Insert: Omit<ChangeHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<ChangeHistory, 'id' | 'created_at'>>;
      };
      change_approvals: {
        Row: ChangeApproval;
        Insert: Omit<ChangeApproval, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChangeApproval, 'id' | 'created_at' | 'updated_at'>>;
      };
      change_schedules: {
        Row: ChangeSchedule;
        Insert: Omit<ChangeSchedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChangeSchedule, 'id' | 'created_at' | 'updated_at'>>;
      };
      change_ticket_links: {
        Row: ChangeTicketLink;
        Insert: Omit<ChangeTicketLink, 'id' | 'created_at'>;
        Update: Partial<Omit<ChangeTicketLink, 'id' | 'created_at'>>;
      };
      change_problem_links: {
        Row: ChangeProblemLink;
        Insert: Omit<ChangeProblemLink, 'id' | 'created_at'>;
        Update: Partial<Omit<ChangeProblemLink, 'id' | 'created_at'>>;
      };
      improvements: {
        Row: Improvement;
        Insert: Omit<Improvement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Improvement, 'id' | 'created_at' | 'updated_at'>>;
      };
      improvement_history: {
        Row: ImprovementHistory;
        Insert: Omit<ImprovementHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<ImprovementHistory, 'id' | 'created_at'>>;
      };
      improvement_ticket_links: {
        Row: ImprovementTicketLink;
        Insert: Omit<ImprovementTicketLink, 'id' | 'created_at'>;
        Update: Partial<Omit<ImprovementTicketLink, 'id' | 'created_at'>>;
      };
    };
  };
}
