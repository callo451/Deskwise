import { supabase } from '../lib/supabase';

export interface PermissionProfile {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionSetting {
  id: string;
  profile_id: string;
  category: string;
  permission: string;
  allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  name: string;
  description?: string;
  tenantId: string;
  permissions?: {
    category: string;
    permission: string;
    allowed: boolean;
  }[];
}

export interface UpdateProfileData {
  name?: string;
  description?: string;
}

/**
 * Fetch all permission profiles for a tenant
 * @param tenantId The tenant ID to filter profiles by
 */
export const fetchPermissionProfiles = async (tenantId: string): Promise<PermissionProfile[]> => {
  const { data, error } = await supabase
    .from('permission_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch a single permission profile by ID
 * @param profileId The profile ID to fetch
 */
export const fetchPermissionProfileById = async (profileId: string): Promise<PermissionProfile | null> => {
  const { data, error } = await supabase
    .from('permission_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Fetch all permission settings for a profile
 * @param profileId The profile ID to fetch settings for
 */
export const fetchPermissionSettings = async (profileId: string): Promise<PermissionSetting[]> => {
  const { data, error } = await supabase
    .from('permission_settings')
    .select('*')
    .eq('profile_id', profileId)
    .order('category')
    .order('permission');

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Create a new permission profile
 * @param profileData The profile data to create
 */
export const createPermissionProfile = async (profileData: CreateProfileData): Promise<string> => {
  // Check if profile with this name already exists for the tenant
  const { data: existingProfiles } = await supabase
    .from('permission_profiles')
    .select('id')
    .eq('tenant_id', profileData.tenantId)
    .eq('name', profileData.name);

  if (existingProfiles && existingProfiles.length > 0) {
    throw new Error('A profile with this name already exists');
  }

  // Create the profile
  const { data, error } = await supabase
    .from('permission_profiles')
    .insert({
      tenant_id: profileData.tenantId,
      name: profileData.name,
      description: profileData.description || null,
      is_system: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create permission profile');
  }

  // If permissions are provided, add them
  if (profileData.permissions && profileData.permissions.length > 0) {
    const permissionsToInsert = profileData.permissions.map(p => ({
      profile_id: data.id,
      category: p.category,
      permission: p.permission,
      allowed: p.allowed
    }));

    const { error: permissionError } = await supabase
      .from('permission_settings')
      .insert(permissionsToInsert);

    if (permissionError) {
      throw permissionError;
    }
  }

  return data.id;
};

/**
 * Update a permission profile
 * @param profileId The profile ID to update
 * @param profileData The profile data to update
 */
export const updatePermissionProfile = async (profileId: string, profileData: UpdateProfileData): Promise<void> => {
  const { error } = await supabase
    .from('permission_profiles')
    .update({
      name: profileData.name,
      description: profileData.description,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    throw error;
  }
};

/**
 * Delete a permission profile
 * @param profileId The profile ID to delete
 */
export const deletePermissionProfile = async (profileId: string): Promise<void> => {
  // Check if this is a system profile
  const { data: profile, error: profileError } = await supabase
    .from('permission_profiles')
    .select('is_system')
    .eq('id', profileId)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (profile && profile.is_system) {
    throw new Error('Cannot delete a system profile');
  }

  // Check if any users are using this profile
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('profile_id', profileId);

  if (usersError) {
    throw usersError;
  }

  if (users && users.length > 0) {
    throw new Error('Cannot delete a profile that is assigned to users');
  }

  // Delete the profile
  const { error } = await supabase
    .from('permission_profiles')
    .delete()
    .eq('id', profileId);

  if (error) {
    throw error;
  }
};

/**
 * Update permission settings for a profile
 * @param profileId The profile ID to update settings for
 * @param settings The settings to update
 */
export const updatePermissionSettings = async (
  profileId: string, 
  settings: { category: string; permission: string; allowed: boolean }[]
): Promise<void> => {
  // Check if this is a system profile
  const { data: profile, error: profileError } = await supabase
    .from('permission_profiles')
    .select('is_system')
    .eq('id', profileId)
    .single();

  if (profileError) {
    throw profileError;
  }

  // For each setting, upsert it
  for (const setting of settings) {
    const { data: existingSetting } = await supabase
      .from('permission_settings')
      .select('id')
      .eq('profile_id', profileId)
      .eq('category', setting.category)
      .eq('permission', setting.permission)
      .single();

    if (existingSetting) {
      // Update existing setting
      const { error } = await supabase
        .from('permission_settings')
        .update({
          allowed: setting.allowed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSetting.id);

      if (error) {
        throw error;
      }
    } else {
      // Create new setting
      const { error } = await supabase
        .from('permission_settings')
        .insert({
          profile_id: profileId,
          category: setting.category,
          permission: setting.permission,
          allowed: setting.allowed
        });

      if (error) {
        throw error;
      }
    }
  }
};

/**
 * Assign a permission profile to a user
 * @param userId The user ID to update
 * @param profileId The profile ID to assign
 */
export const assignProfileToUser = async (userId: string, profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ profile_id: profileId })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Get all available permission categories and their permissions
 */
export const getAvailablePermissions = (): { 
  category: string; 
  name: string;
  permissions: { id: string; name: string; description: string }[] 
}[] => {
  return [
    {
      category: 'tickets',
      name: 'Tickets',
      permissions: [
        { id: 'view_own', name: 'View Own Tickets', description: 'User can view tickets they created' },
        { id: 'view_assigned', name: 'View Assigned Tickets', description: 'User can view tickets assigned to them' },
        { id: 'view_all', name: 'View All Tickets', description: 'User can view all tickets in the system' },
        { id: 'create', name: 'Create Tickets', description: 'User can create new tickets' },
        { id: 'edit_own', name: 'Edit Own Tickets', description: 'User can edit tickets they created' },
        { id: 'edit_assigned', name: 'Edit Assigned Tickets', description: 'User can edit tickets assigned to them' },
        { id: 'edit_all', name: 'Edit All Tickets', description: 'User can edit any ticket in the system' },
        { id: 'delete', name: 'Delete Tickets', description: 'User can delete tickets' },
        { id: 'assign', name: 'Assign Tickets', description: 'User can assign tickets to others' }
      ]
    },
    {
      category: 'knowledge',
      name: 'Knowledge Base',
      permissions: [
        { id: 'view', name: 'View Articles', description: 'User can view knowledge base articles' },
        { id: 'create', name: 'Create Articles', description: 'User can create new knowledge base articles' },
        { id: 'edit', name: 'Edit Articles', description: 'User can edit knowledge base articles' },
        { id: 'delete', name: 'Delete Articles', description: 'User can delete knowledge base articles' },
        { id: 'publish', name: 'Publish Articles', description: 'User can publish/unpublish knowledge base articles' }
      ]
    },
    {
      category: 'users',
      name: 'Users',
      permissions: [
        { id: 'view', name: 'View Users', description: 'User can view other users in the system' },
        { id: 'invite', name: 'Invite Users', description: 'User can invite new users to the system' },
        { id: 'edit', name: 'Edit Users', description: 'User can edit user details' },
        { id: 'deactivate', name: 'Deactivate Users', description: 'User can deactivate other users' },
        { id: 'delete', name: 'Delete Users', description: 'User can permanently delete users' },
        { id: 'manage', name: 'Manage Permissions', description: 'User can manage permission profiles and assign them to users' }
      ]
    },
    {
      category: 'settings',
      name: 'Settings',
      permissions: [
        { id: 'view', name: 'View Settings', description: 'User can view system settings' },
        { id: 'manage', name: 'Manage Settings', description: 'User can modify system settings' }
      ]
    },
    {
      category: 'reports',
      name: 'Reports',
      permissions: [
        { id: 'view', name: 'View Reports', description: 'User can view reports' },
        { id: 'create', name: 'Create Reports', description: 'User can create custom reports' },
        { id: 'export', name: 'Export Reports', description: 'User can export reports to various formats' }
      ]
    }
  ];
};
