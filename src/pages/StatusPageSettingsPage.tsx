import React from 'react';
import { Helmet } from 'react-helmet-async';
import SettingsLayout from '../components/settings/SettingsLayout';
import StatusPageSettings from '../components/settings/StatusPageSettings';

const StatusPageSettingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Status Page Settings | DeskWise ITSM</title>
      </Helmet>
      
      <SettingsLayout>
        <StatusPageSettings />
      </SettingsLayout>
    </>
  );
};

export default StatusPageSettingsPage;
