/**
 * Default Ticket Settings Templates for New Tenants
 */

// Default Ticket Priorities (Example ITIL alignment)
export const defaultTicketPriorities = [
  {
    name: 'Urgent',
    color: '#EF4444', // Red
    description: 'Critical impact on business operations or safety.',
    sort_order: 10,
    is_default: false,
  },
  {
    name: 'High',
    color: '#F97316', // Orange
    description: 'Significant impact on business operations or a large number of users.',
    sort_order: 20,
    is_default: false,
  },
  {
    name: 'Medium',
    color: '#FACC15', // Yellow
    description: 'Moderate impact on business operations or a single user/small group.',
    sort_order: 30,
    is_default: true, // Often the default
  },
  {
    name: 'Low',
    color: '#22C55E', // Green
    description: 'Minimal impact, non-critical request or issue.',
    sort_order: 40,
    is_default: false,
  },
];

// Default Ticket Categories (Example ITIL alignment)
export const defaultTicketCategories = [
  {
    name: 'Incident',
    description: 'An unplanned interruption or reduction in quality of an IT service.',
    parent_id: null,
    sort_order: 10,
    is_active: true,
  },
  {
    name: 'Service Request',
    description: 'A request for information, advice, a standard change, or access to an IT service.',
    parent_id: null,
    sort_order: 20,
    is_active: true,
  },
  {
    name: 'Problem',
    description: 'The underlying cause of one or more incidents.',
    parent_id: null,
    sort_order: 30,
    is_active: true,
  },
  {
    name: 'Change Request',
    description: 'A request to alter an IT service, configuration item, or system.',
    parent_id: null,
    sort_order: 40,
    is_active: true,
  },
];

// Default Ticket Statuses (Example ITIL alignment)
export const defaultTicketStatuses = [
  {
    name: 'New',
    color: '#6B7280', // Gray
    description: 'Ticket has been logged but not yet assigned or reviewed.',
    sort_order: 10,
    is_default: true,
    is_closed: false,
  },
  {
    name: 'Open',
    color: '#3B82F6', // Blue
    description: 'Ticket is actively being worked on.',
    sort_order: 20,
    is_default: false,
    is_closed: false,
  },
  {
    name: 'Pending',
    color: '#F97316', // Orange
    description: 'Waiting for information from the user or a third party.',
    sort_order: 30,
    is_default: false,
    is_closed: false,
  },
  {
    name: 'Resolved',
    color: '#10B981', // Emerald
    description: 'Work is complete, pending confirmation from the user.',
    sort_order: 40,
    is_default: false,
    is_closed: true, // Often considered a 'closed' state for reporting
  },
  {
    name: 'Closed',
    color: '#1F2937', // Dark Gray
    description: 'Ticket is fully closed and requires no further action.',
    sort_order: 50,
    is_default: false,
    is_closed: true,
  },
];

// TODO: Add default SLAs and Queues if needed
