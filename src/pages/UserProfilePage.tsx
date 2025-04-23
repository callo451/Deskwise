import React from 'react';
import UserProfile from '../components/settings/UserProfile';
import SettingsLayout from '../components/settings/SettingsLayout';

const UserProfilePage: React.FC = () => {
  return (
    <SettingsLayout>
      <UserProfile />
    </SettingsLayout>
  );
};

export default UserProfilePage;
