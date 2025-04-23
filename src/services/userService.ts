import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types/database';

export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface InviteUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  tenantId: string;
}

/**
 * Get all users
 * This is a convenience function that doesn't require a tenant ID
 */
export const getUsers = async (): Promise<User[]> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw userError;
  }
  
  // Get the user's tenant_id
  const { data: userDetails, error: userDetailsError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userData.user?.id)
    .single();
    
  if (userDetailsError) {
    throw userDetailsError;
  }
  
  return fetchUsers(userDetails.tenant_id);
};

/**
 * Fetch users for the current tenant
 * @param tenantId The tenant ID to filter users by
 */
export const fetchUsers = async (tenantId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch a single user by ID
 * @param userId The user ID to fetch
 */
export const fetchUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update a user's profile information
 * @param userId The user ID to update
 * @param userData The user data to update
 */
export const updateUser = async (userId: string, userData: UserUpdateData): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Invite a new user to the system
 * @param userData The user data for the invitation
 */
export const inviteUser = async (userData: InviteUserData): Promise<string> => {
  // Check if user already exists
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('email', userData.email)
    .eq('tenant_id', userData.tenantId);

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  // Create the user using the standard signup method
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: tempPassword,
    options: {
      data: {
        tenant_id: userData.tenantId,
        first_name: userData.firstName || null,
        last_name: userData.lastName || null,
        role: userData.role
      }
    }
  });

  if (error) throw error;
  
  if (!data.user) {
    throw new Error('Failed to create user');
  }
  
  // Create user record in the users table
  const { error: insertError } = await supabase.from('users').insert({
    id: data.user.id,
    tenant_id: userData.tenantId,
    email: userData.email,
    first_name: userData.firstName || null,
    last_name: userData.lastName || null,
    role: userData.role,
    is_active: true
  });

  if (insertError) throw insertError;
  
  return data.user.id;
};

/**
 * Deactivate a user
 * @param userId The user ID to deactivate
 */
export const deactivateUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Reactivate a user
 * @param userId The user ID to reactivate
 */
export const reactivateUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Change a user's role
 * @param userId The user ID to update
 * @param role The new role to assign
 */
export const changeUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Permanently delete a user
 * @param userId The user ID to delete
 */
export const deleteUser = async (userId: string): Promise<void> => {
  // First delete from the users table
  const { error: deleteUserError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (deleteUserError) {
    throw deleteUserError;
  }
  
  // Then delete from auth (this will cascade to all related data)
  const { error: deleteAuthError } = await supabase.rpc('delete_user', {
    user_id: userId
  });

  if (deleteAuthError) {
    throw deleteAuthError;
  }
};
