import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types/database';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { fetchUsers, inviteUser, changeUserRole, deactivateUser, deleteUser } from '../../services/userService';
import { assignProfileToUser, fetchPermissionProfiles, PermissionProfile } from '../../services/permissionService';
import PermissionProfiles from './PermissionProfiles';

const UserManagement: React.FC = () => {
  const { userDetails } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as UserRole,
    profileId: '',
  });

  useEffect(() => {
    loadUsers();
    if (userDetails?.tenant_id) {
      loadPermissionProfiles();
    }
  }, [userDetails?.tenant_id]);

  const loadUsers = async () => {
    if (!userDetails?.tenant_id) return;
    
    setLoading(true);
    try {
      const data = await fetchUsers(userDetails.tenant_id);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const loadPermissionProfiles = async () => {
    if (!userDetails?.tenant_id) return;
    
    setLoadingProfiles(true);
    try {
      const data = await fetchPermissionProfiles(userDetails.tenant_id);
      setPermissionProfiles(data);
    } catch (error) {
      console.error('Error fetching permission profiles:', error);
      toast.error('Failed to load permission profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userDetails?.tenant_id) {
      toast.error('Tenant ID is missing');
      return;
    }
    
    try {
      const userId = await inviteUser({
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        role: inviteData.role,
        tenantId: userDetails.tenant_id
      });
      
      // If a profile was selected, assign it to the user
      if (inviteData.profileId) {
        await assignProfileToUser(userId, inviteData.profileId);
      }
      
      toast.success('User invited successfully');
      setShowInviteForm(false);
      setInviteData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'user',
        profileId: '',
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Failed to invite user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    // Don't allow non-admin users to change roles
    if (userDetails?.role !== 'admin') {
      toast.error('Only administrators can change user roles');
      return;
    }
    
    // Don't allow users to change their own role
    if (userId === userDetails?.id) {
      toast.error('You cannot change your own role');
      return;
    }
    
    // Find the user being updated
    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) {
      toast.error('User not found');
      return;
    }
    
    // If the role is the same, do nothing
    if (userToUpdate.role === newRole) {
      return;
    }
    
    // Show confirmation for critical role changes
    if (newRole === 'admin') {
      if (!confirm(`Are you sure you want to give ${userToUpdate.first_name || userToUpdate.email} administrator privileges? This will grant them full access to all system settings.`)) {
        // Reset the dropdown to the previous value
        setUsers(users.map(user => user));
        return;
      }
    }
    
    try {
      // Optimistically update the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Make the API call
      await changeUserRole(userId, newRole);
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      
      // Revert the optimistic update
      setUsers(users.map(user => user));
      
      // Show a more specific error message if available
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userToDeactivate: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await deactivateUser(userToDeactivate);
      toast.success('User deactivated successfully');
      
      // Refresh the user list
      loadUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const handleDeleteUser = async (userToDelete: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteUser(userToDelete);
      toast.success('User deleted permanently');
      
      // Refresh the user list
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'technician':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignProfile = async (userId: string, profileId: string) => {
    try {
      await assignProfileToUser(userId, profileId);
      toast.success('Permission profile assigned successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error assigning profile:', error);
      toast.error(error.message || 'Failed to assign permission profile');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
        {activeTab === 'users' && (
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? 'Cancel' : 'Invite User'}
          </Button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'permissions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Permission Profiles
          </button>
        </nav>
      </div>

      {activeTab === 'users' && showInviteForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-medium mb-4">Invite New User</h2>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  required
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="user">User</option>
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="profileId" className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Profile
                </label>
                <select
                  id="profileId"
                  value={inviteData.profileId}
                  onChange={(e) => setInviteData({ ...inviteData, profileId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a profile (optional)</option>
                  {permissionProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}{profile.is_system ? ' (System)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Optional. If not selected, user will have default permissions based on role.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Send Invitation
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'users' ? (
        loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission Profile
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : 'No name provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userDetails?.role === 'admin' ? (
                        <select
                          value={user.profile_id || ''}
                          onChange={(e) => handleAssignProfile(user.id, e.target.value)}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                          disabled={user.id === userDetails?.id && user.role !== 'admin'}
                        >
                          <option value="">Default ({user.role})</option>
                          {permissionProfiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}{profile.is_system ? ' (System)' : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {user.profile_id ? 'Custom' : `Default (${user.role})`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        {user.id !== userDetails?.id && (
                          <>
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              disabled={!user.is_active}
                            >
                              {user.is_active ? 'Deactivate' : 'Deactivated'}
                            </button>
                            
                            {userDetails?.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-800 hover:text-red-900 text-sm font-medium ml-2"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        )
      ) : (
        <PermissionProfiles 
          onSelectProfile={setSelectedProfileId} 
          onProfilesChanged={loadPermissionProfiles}
        />
      )}
    </div>
  );
};

export default UserManagement;
