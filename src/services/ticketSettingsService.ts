import { supabase } from '../lib/supabase';

export interface TicketIdSettings {
  id: string;
  tenant_id: string;
  prefix: string;
  suffix: string;
  padding_length: number;
  next_number: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch ticket ID settings for the current tenant
 * @param tenantId The tenant ID to fetch settings for
 */
export const fetchTicketIdSettings = async (tenantId: string): Promise<TicketIdSettings | null> => {
  const { data, error } = await supabase
    .from('ticket_id_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Update ticket ID settings
 * @param tenantId The tenant ID to update settings for
 * @param settings The settings to update
 */
export const updateTicketIdSettings = async (
  tenantId: string,
  settings: {
    prefix?: string;
    suffix?: string;
    padding_length?: number;
    next_number?: number;
  }
): Promise<TicketIdSettings> => {
  // Check if settings exist for this tenant
  const { data: existingSettings } = await supabase
    .from('ticket_id_settings')
    .select('id')
    .eq('tenant_id', tenantId)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { data, error } = await supabase
      .from('ticket_id_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('ticket_id_settings')
      .insert({
        tenant_id: tenantId,
        prefix: settings.prefix || 'TKT-',
        suffix: settings.suffix || '',
        padding_length: settings.padding_length || 4,
        next_number: settings.next_number || 1,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * Generate a preview of a ticket ID based on provided settings
 * @param settings The settings to use for the preview
 * @param number Optional number to use for the preview (defaults to 1)
 */
export const generateTicketIdPreview = (
  settings: {
    prefix: string;
    suffix: string;
    padding_length: number;
  },
  number: number = 1
): string => {
  const paddedNumber = number.toString().padStart(settings.padding_length, '0');
  return `${settings.prefix}${paddedNumber}${settings.suffix}`;
};
