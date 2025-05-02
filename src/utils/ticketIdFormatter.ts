import { fetchTicketIdSettings, generateTicketIdPreview } from '../services/ticketSettingsService';

/**
 * Format a ticket ID based on the tenant's ticket ID settings
 * @param ticketId The raw ticket ID from the database
 * @param tenantId The tenant ID to fetch settings for
 * @returns Formatted ticket ID string
 */
export const formatTicketId = async (ticketId: string, tenantId: string): Promise<string> => {
  try {
    // Get the ticket ID settings for the tenant
    const settings = await fetchTicketIdSettings(tenantId);
    
    if (!settings) {
      // If no settings are found, return the first 8 characters of the UUID
      return ticketId.substring(0, 8);
    }
    
    // Extract the numeric part from the UUID
    // For simplicity, we'll use the first 8 characters of the UUID converted to a decimal number
    const numericId = parseInt(ticketId.replace(/-/g, '').substring(0, 8), 16) % 1000000;
    
    // Format the ticket ID using the settings
    return generateTicketIdPreview({
      prefix: settings.prefix,
      suffix: settings.suffix,
      padding_length: settings.padding_length
    }, numericId);
  } catch (error) {
    console.error('Error formatting ticket ID:', error);
    // Fallback to returning the first 8 characters of the UUID
    return ticketId.substring(0, 8);
  }
};

/**
 * Format a ticket ID synchronously using provided settings
 * This is useful when you already have the settings and don't want to fetch them again
 * @param ticketId The raw ticket ID from the database
 * @param settings The ticket ID settings
 * @returns Formatted ticket ID string
 */
export const formatTicketIdWithSettings = (
  ticketId: string, 
  settings: { 
    prefix: string; 
    suffix: string; 
    padding_length: number; 
  }
): string => {
  try {
    // Extract the numeric part from the UUID
    const numericId = parseInt(ticketId.replace(/-/g, '').substring(0, 8), 16) % 1000000;
    
    // Format the ticket ID using the settings
    return generateTicketIdPreview(settings, numericId);
  } catch (error) {
    console.error('Error formatting ticket ID with settings:', error);
    // Fallback to returning the first 8 characters of the UUID
    return ticketId.substring(0, 8);
  }
};
