import { supabase } from '../lib/supabase';

export interface PortalSettings {
  id: string;
  tenant_id: string;
  title: string;
  subtitle: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  banner_image_url: string | null;
  welcome_message: string | null;
  footer_text: string | null;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch portal settings for the current tenant
 */
export const getPortalSettings = async (): Promise<PortalSettings | null> => {
  const { data, error } = await supabase
    .from('portal_settings')
    .select('*')
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
 * Update portal settings
 * @param settings The settings to update
 */
export const updatePortalSettings = async (
  settings: Partial<PortalSettings>
): Promise<PortalSettings> => {
  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from('portal_settings')
    .select('id')
    .single();

  if (existingSettings) {
    // Update existing settings
    const { data, error } = await supabase
      .from('portal_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettings.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new settings with defaults
    const { data, error } = await supabase
      .from('portal_settings')
      .insert({
        title: settings.title || 'IT Service Portal',
        subtitle: settings.subtitle || 'Request services and track your tickets',
        primary_color: settings.primary_color || '#3b82f6',
        secondary_color: settings.secondary_color || '#1e40af',
        logo_url: settings.logo_url || null,
        banner_image_url: settings.banner_image_url || null,
        welcome_message: settings.welcome_message || 'Welcome to the IT Service Portal. How can we help you today?',
        footer_text: settings.footer_text || null,
        custom_css: settings.custom_css || null,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * Upload a logo or banner image for the portal
 * @param file The file to upload
 * @param type The type of image ('logo' or 'banner')
 */
export const uploadPortalImage = async (
  file: File,
  type: 'logo' | 'banner'
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  const filePath = `portal_images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * Apply portal settings to the current page
 * @param settings The portal settings to apply
 */
export const applyPortalSettings = (settings: PortalSettings): void => {
  // Apply primary and secondary colors
  document.documentElement.style.setProperty('--color-primary', settings.primary_color);
  document.documentElement.style.setProperty('--color-primary-dark', settings.secondary_color);
  
  // Apply custom CSS if provided
  if (settings.custom_css) {
    const styleElement = document.createElement('style');
    styleElement.textContent = settings.custom_css;
    document.head.appendChild(styleElement);
  }
  
  // Update page title
  document.title = settings.title;
};
