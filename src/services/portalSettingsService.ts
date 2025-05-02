import { supabase } from '../lib/supabase';

export interface PortalSettings {
  id: string; // UUID stored as string in TypeScript
  tenant_id: string; // UUID stored as string in TypeScript
  title: string;
  subtitle: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  banner_image_url: string | null;
  footer_text: string | null;
  custom_css: string | null;
  welcome_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch portal settings for the current tenant
 */
export const getPortalSettings = async (): Promise<PortalSettings | null> => {
  // First, ensure we have the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.warn('No active session found when fetching portal settings');
    return null;
  }
  
  // Get the current user's tenant_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', session.user.id)
    .single();
  
  if (userError) {
    console.error('Error fetching user data:', userError);
    throw userError;
  }
  
  const tenant_id = userData.tenant_id;
  
  // Check if user has permission to access portal settings (used for UI purposes)
  // const isAdminOrManager = userData.role === 'admin' || userData.role === 'manager';
  
  // Get settings for this tenant
  // Using RPC call to bypass RLS for fetching (since we'll check permissions ourselves)
  const { data, error } = await supabase.rpc('get_portal_settings_by_tenant', {
    p_tenant_id: tenant_id // tenant_id is a UUID string
  });

  console.log('Get portal settings response:', { data, error, tenant_id });

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null;
    }
    console.error('Error fetching portal settings:', error);
    throw error;
  }

  // If data is an array, return the first item
  if (Array.isArray(data) && data.length > 0) {
    console.log('Returning first item from array:', data[0]);
    return data[0];
  }

  console.log('Returning data directly:', data);
  return data;
};

/**
 * Update portal settings
 * @param settings The settings to update
 */
export const updatePortalSettings = async (
  settings: Partial<PortalSettings>
): Promise<PortalSettings> => {
  // First, ensure we have the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User must be logged in to update portal settings');
  }
  
  // Get the current user's tenant_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', session.user.id)
    .single();
  
  if (userError) {
    console.error('Error fetching user data:', userError);
    throw userError;
  }
  
  const tenant_id = userData.tenant_id;
  const isAdminOrManager = userData.role === 'admin' || userData.role === 'manager';
  
  if (!isAdminOrManager) {
    throw new Error('Only admins and managers can update portal settings');
  }
  
  // Check if settings exist for this tenant using RPC to bypass RLS
  const { data: existingSettingsArray, error: settingsError } = await supabase.rpc('get_portal_settings_by_tenant', {
    p_tenant_id: tenant_id // tenant_id is a UUID string
  });
  
  console.log('Check existing settings response:', { existingSettingsArray, settingsError, tenant_id });
  
  if (settingsError) {
    console.error('Error checking existing settings:', settingsError);
    throw settingsError;
  }
  
  const existingSettings = existingSettingsArray && existingSettingsArray.length > 0 ? existingSettingsArray[0] : null;
  console.log('Existing settings:', existingSettings);

  if (existingSettings) {
    // Update existing settings using RPC to bypass RLS
    console.log('Updating settings with:', {
      id: existingSettings.id,
      tenant_id,
      settings
    });
    
    const { error } = await supabase.rpc('update_portal_settings', {
      p_id: existingSettings.id,
      p_tenant_id: tenant_id,
      p_title: settings.title || existingSettings.title,
      p_subtitle: settings.subtitle || existingSettings.subtitle,
      p_primary_color: settings.primary_color || existingSettings.primary_color,
      p_secondary_color: settings.secondary_color || existingSettings.secondary_color,
      p_logo_url: settings.logo_url || existingSettings.logo_url,
      p_banner_image_url: settings.banner_image_url || existingSettings.banner_image_url,
      p_footer_text: settings.footer_text || existingSettings.footer_text,
      p_custom_css: settings.custom_css || existingSettings.custom_css,
      p_welcome_message: settings.welcome_message || existingSettings.welcome_message
    });

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
    
    console.log('Settings updated successfully');
    
    // Fetch the updated settings
    const { data: updatedSettings, error: fetchError } = await supabase.rpc('get_portal_settings_by_tenant', {
      p_tenant_id: tenant_id // tenant_id is a UUID string
    });
    
    if (fetchError) {
      console.error('Error fetching updated settings:', fetchError);
      throw fetchError;
    }
    
    return updatedSettings[0];
  } else {
    // Create new settings with defaults using RPC to bypass RLS
    console.log('Creating new settings with:', {
      tenant_id,
      settings
    });
    
    const { error } = await supabase.rpc('create_portal_settings', {
      p_tenant_id: tenant_id,
      p_title: settings.title || 'IT Service Portal',
      p_subtitle: settings.subtitle || 'Request services and track your tickets',
      p_primary_color: settings.primary_color || '#3b82f6',
      p_secondary_color: settings.secondary_color || '#1e40af',
      p_logo_url: settings.logo_url || null,
      p_banner_image_url: settings.banner_image_url || null,
      p_footer_text: settings.footer_text || null,
      p_custom_css: settings.custom_css || null,
      p_welcome_message: settings.welcome_message || 'Welcome to the IT Service Portal. How can we help you today?'
    });

    if (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
    
    console.log('Settings created successfully');
    
    // Fetch the newly created settings
    const { data: newSettings, error: fetchError } = await supabase.rpc('get_portal_settings_by_tenant', {
      p_tenant_id: tenant_id // tenant_id is a UUID string
    });
    
    if (fetchError) {
      console.error('Error fetching new settings:', fetchError);
      throw fetchError;
    }
    
    return newSettings[0];
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
  // We'll use just the filename as the path since we're already specifying the bucket

  const { error: uploadError } = await supabase.storage
    .from('portal_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('portal_images').getPublicUrl(fileName);
  
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
