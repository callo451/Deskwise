import React from 'react';
import UserManagement from '../components/settings/UserManagement';
import SettingsLayout from '../components/settings/SettingsLayout';

const UserManagementPage: React.FC = () => {
  return (
    <SettingsLayout>
      <UserManagement />
    </SettingsLayout>
  );
};

export default UserManagementPage;
