import React from 'react';
import SettingsLayout from '../components/settings/SettingsLayout';
import TicketSettings from '../components/settings/TicketSettings';

const TicketSettingsPage: React.FC = () => {
  return (
    <SettingsLayout>
      <TicketSettings />
    </SettingsLayout>
  );
};

export default TicketSettingsPage;
