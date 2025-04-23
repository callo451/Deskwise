import Papa from 'papaparse';
import { createTicket, CreateTicketData } from '../services/ticketService';
import { getTicketPriorities, getTicketStatuses, getTicketCategories } from '../services/settingsService';

export interface CSVTicket {
  title: string;
  description: string;
  priority_id?: string;
  status_id?: string;
  category_id?: string;
  queue_id?: string;
  service_id?: string;
  assigned_to?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * Parse CSV file and return parsed data
 */
export const parseCSVFile = (file: File): Promise<CSVTicket[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVTicket[];
        resolve(data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Validate CSV data against required fields
 */
export const validateCSVData = (data: CSVTicket[]): { valid: boolean; errors: Array<{ row: number; error: string }> } => {
  const errors: Array<{ row: number; error: string }> = [];

  data.forEach((row, index) => {
    if (!row.title) {
      errors.push({ row: index + 1, error: 'Title is required' });
    }
    if (!row.description) {
      errors.push({ row: index + 1, error: 'Description is required' });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Import tickets from CSV data
 */
export const importTicketsFromCSV = async (data: CSVTicket[]): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Fetch settings data for validation
  const [priorities, statuses, categories] = await Promise.all([
    getTicketPriorities(),
    getTicketStatuses(),
    getTicketCategories()
  ]);

  // Get default status and priority
  const defaultStatus = statuses.find(s => s.is_default);
  const defaultPriority = priorities.find(p => p.is_default);

  // Process each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      // Validate priority_id if provided
      if (row.priority_id && !priorities.some(p => p.id === row.priority_id)) {
        throw new Error(`Invalid priority_id: ${row.priority_id}`);
      }

      // Validate status_id if provided
      if (row.status_id && !statuses.some(s => s.id === row.status_id)) {
        throw new Error(`Invalid status_id: ${row.status_id}`);
      }

      // Validate category_id if provided
      if (row.category_id && !categories.some(c => c.id === row.category_id)) {
        throw new Error(`Invalid category_id: ${row.category_id}`);
      }

      // Create ticket
      const ticketData: CreateTicketData = {
        title: row.title,
        description: row.description,
        priority_id: row.priority_id || (defaultPriority ? defaultPriority.id : undefined),
        status_id: row.status_id || (defaultStatus ? defaultStatus.id : undefined),
        category_id: row.category_id || undefined,
        queue_id: row.queue_id || undefined,
        service_id: row.service_id || undefined,
        assigned_to: row.assigned_to || undefined
      };

      await createTicket(ticketData);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return result;
};

/**
 * Generate a sample CSV template for ticket import
 */
export const generateCSVTemplate = (): string => {
  const headers = [
    'title',
    'description',
    'priority_id',
    'status_id',
    'category_id',
    'queue_id',
    'service_id',
    'assigned_to'
  ];
  
  const sampleData = [
    'Hardware Issue',
    'User reported laptop not turning on',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const csvContent = [
    headers.join(','),
    sampleData.join(',')
  ].join('\n');

  return csvContent;
};
