import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { 
  PermissionProfile, 
  PermissionSetting,
  fetchPermissionProfiles, 
  fetchPermissionSettings,
  createPermissionProfile,
  updatePermissionProfile,
  deletePermissionProfile,
  updatePermissionSettings,
  getAvailablePermissions
} from '../../services/permissionService';

interface PermissionProfilesProps {
  onSelectProfile?: (profileId: string) => void;
  onProfilesChanged?: () => void;
}

const PermissionProfiles: React.FC<PermissionProfilesProps> = ({ onSelectProfile, onProfilesChanged }) => {
  const { userDetails } = useAuth();
  const [profiles, setProfiles] = useState<PermissionProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PermissionProfile | null>(null);
  const [profileSettings, setProfileSettings] = useState<PermissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  // Track whether we're editing an existing profile or creating a new one
  const [isEditing, setIsEditing] = useState(false);
  
  const availablePermissions = getAvailablePermissions();

  useEffect(() => {
    loadProfiles();
  }, [userDetails]);

  const loadProfiles = async () => {
    if (!userDetails?.tenant_id) return;
    
    setLoading(true);
    try {
      const data = await fetchPermissionProfiles(userDetails.tenant_id);
      setProfiles(data);
      
      // If there are profiles and none is selected, select the first one
      if (data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
        loadProfileSettings(data[0].id);
        if (onSelectProfile) {
          onSelectProfile(data[0].id);
        }
      } else if (selectedProfile) {
        // If a profile was already selected, make sure it's still in the list
        const stillExists = data.find(p => p.id === selectedProfile.id);
        if (stillExists) {
          setSelectedProfile(stillExists);
          loadProfileSettings(stillExists.id);
        } else if (data.length > 0) {
          setSelectedProfile(data[0]);
          loadProfileSettings(data[0].id);
          if (onSelectProfile) {
            onSelectProfile(data[0].id);
          }
        } else {
          setSelectedProfile(null);
          setProfileSettings([]);
        }
      }
    } catch (error) {
      console.error('Error fetching permission profiles:', error);
      toast.error('Failed to load permission profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileSettings = async (profileId: string) => {
    try {
      const data = await fetchPermissionSettings(profileId);
      setProfileSettings(data);
    } catch (error) {
      console.error('Error fetching profile settings:', error);
      toast.error('Failed to load profile settings');
    }
  };

  const handleSelectProfile = (profile: PermissionProfile) => {
    setSelectedProfile(profile);
    loadProfileSettings(profile.id);
    if (onSelectProfile) {
      onSelectProfile(profile.id);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userDetails?.tenant_id) {
      toast.error('Tenant ID is missing');
      return;
    }
    
    try {
      const profileId = await createPermissionProfile({
        name: formData.name,
        description: formData.description,
        tenantId: userDetails.tenant_id,
      });
      
      toast.success('Permission profile created successfully');
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
      });
      
      // Reload profiles and select the new one
      await loadProfiles();
      
      // Find the new profile in the updated list
      const updatedProfiles = await fetchPermissionProfiles(userDetails.tenant_id);
      const newProfile = updatedProfiles.find(p => p.id === profileId);
      if (newProfile) {
        setSelectedProfile(newProfile);
        loadProfileSettings(newProfile.id);
        if (onSelectProfile) {
          onSelectProfile(newProfile.id);
        }
      }
    } catch (error: any) {
      console.error('Error creating permission profile:', error);
      toast.error(error.message || 'Failed to create permission profile');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProfile) {
      toast.error('No profile selected');
      return;
    }
    
    try {
      await updatePermissionProfile(selectedProfile.id, {
        name: formData.name,
        description: formData.description,
      });
      
      toast.success('Permission profile updated successfully');
      setShowEditForm(false);
      
      // Reload profiles
      await loadProfiles();
      
      // Notify parent component that profiles have changed
      if (onProfilesChanged) {
        onProfilesChanged();
      }
    } catch (error: any) {
      console.error('Error updating permission profile:', error);
      toast.error(error.message || 'Failed to update permission profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this permission profile? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deletePermissionProfile(profileId);
      toast.success('Permission profile deleted successfully');
      
      // Reload profiles
      await loadProfiles();
      
      // Notify parent component that profiles have changed
      if (onProfilesChanged) {
        onProfilesChanged();
      }
    } catch (error: any) {
      console.error('Error deleting permission profile:', error);
      toast.error(error.message || 'Failed to delete permission profile');
    }
  };

  const handleTogglePermission = async (category: string, permission: string, allowed: boolean) => {
    if (!selectedProfile) {
      toast.error('No profile selected');
      return;
    }
    
    // Don't allow changes to system profiles
    if (selectedProfile.is_system && userDetails?.role !== 'admin') {
      toast.error('System profiles cannot be modified');
      return;
    }
    
    try {
      await updatePermissionSettings(selectedProfile.id, [
        { category, permission, allowed }
      ]);
      
      // Update the local state
      setProfileSettings(prevSettings => {
        const existingSetting = prevSettings.find(
          s => s.profile_id === selectedProfile.id && 
               s.category === category && 
               s.permission === permission
        );
        
        if (existingSetting) {
          // Update existing setting
          return prevSettings.map(s => 
            s.id === existingSetting.id ? { ...s, allowed } : s
          );
        } else {
          // Add new setting
          return [
            ...prevSettings,
            {
              id: `temp-${Date.now()}`, // Temporary ID until refresh
              profile_id: selectedProfile.id,
              category,
              permission,
              allowed,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        }
      });
      
      toast.success('Permission updated');
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error(error.message || 'Failed to update permission');
    }
  };

  const isPermissionAllowed = (category: string, permission: string): boolean => {
    const setting = profileSettings.find(
      s => s.category === category && s.permission === permission
    );
    return setting ? setting.allowed : false;
  };

  const startEditProfile = () => {
    if (selectedProfile) {
      setFormData({
        name: selectedProfile.name,
        description: selectedProfile.description || '',
      });
      setShowEditForm(true);
      setIsEditing(true);
    }
  };

  const startCreateProfile = () => {
    setFormData({
      name: '',
      description: '',
    });
    setShowCreateForm(true);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Permission Profiles</h2>
        {userDetails?.role === 'admin' && (
          <Button onClick={startCreateProfile} size="sm">
            Create Profile
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile List */}
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-700 mb-3">Profiles</h3>
            <ul className="space-y-2">
              {profiles.map((profile) => (
                <li 
                  key={profile.id}
                  className={`px-3 py-2 rounded-md cursor-pointer ${
                    selectedProfile?.id === profile.id 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelectProfile(profile)}
                >
                  <div className="font-medium">{profile.name}</div>
                  {profile.is_system && (
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
                      System
                    </span>
                  )}
                </li>
              ))}

              {profiles.length === 0 && (
                <li className="text-gray-500 text-sm">No profiles found</li>
              )}
            </ul>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-3">
            {selectedProfile ? (
              <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedProfile.name}</h3>
                    <p className="text-sm text-gray-500">{selectedProfile.description}</p>
                  </div>
                  
                  {userDetails?.role === 'admin' && !selectedProfile.is_system && (
                    <div className="flex space-x-2">
                      <Button onClick={startEditProfile} variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handleDeleteProfile(selectedProfile.id)} 
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Permissions</h4>
                  
                  <div className="space-y-6">
                    {availablePermissions.map((category) => (
                      <div key={category.category} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-medium">
                          {category.name}
                        </div>
                        <div className="divide-y divide-gray-200">
                          {category.permissions.map((permission) => (
                            <div 
                              key={`${category.category}-${permission.id}`}
                              className="px-4 py-3 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium text-sm">{permission.name}</div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                              </div>
                              
                              <div>
                                <label className="inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isPermissionAllowed(category.category, permission.id)}
                                    onChange={(e) => handleTogglePermission(
                                      category.category, 
                                      permission.id, 
                                      e.target.checked
                                    )}
                                    disabled={selectedProfile.is_system || userDetails?.role !== 'admin'}
                                  />
                                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-md p-6 text-center text-gray-500">
                Select a profile to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? 'Edit Permission Profile' : 'Create Permission Profile'}
            </h3>
            
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Permission Profile</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionProfiles;
