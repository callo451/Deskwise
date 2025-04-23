import React, { useState } from 'react';
// Using Helmet for page title management
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import ChangeList from '../components/changes/ChangeList';
import ChangeForm from '../components/changes/ChangeForm';
import { useAuth } from '../contexts/AuthContext';

const ChangesPage: React.FC = () => {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Check if user can create changes
  const canCreateChange = userDetails?.role === 'admin' || 
                         userDetails?.role === 'manager' || 
                         userDetails?.role === 'technician';
  
  const handleCreateChange = () => {
    setShowCreateForm(true);
  };
  
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };
  
  const handleChangeCreated = (changeId: string) => {
    setShowCreateForm(false);
    navigate(`/changes/${changeId}`);
  };
  
  return (
    <>
      <Helmet>
        <title>Change Management | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        {showCreateForm ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Change</h1>
            <ChangeForm 
              onCancel={handleCancelCreate} 
              onChangeCreated={handleChangeCreated}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Change Management</h1>
                <p className="text-gray-600 mt-1">
                  Plan and track system and service changes
                </p>
              </div>
              
              {canCreateChange && (
                <Button
                  variant="default"
                  onClick={handleCreateChange}
                  className="flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  New Change
                </Button>
              )}
            </div>
            
            <div className="flex-1">
              <ChangeList />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChangesPage;
