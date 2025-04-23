import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

import ImprovementList from '../components/improvements/ImprovementList';
import ImprovementForm from '../components/improvements/ImprovementForm';

const ImprovementsPage: React.FC = () => {
  const { userDetails } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
  // Check if user can create improvements
  const canCreateImprovement = userDetails?.role === 'admin' || userDetails?.role === 'manager';
  
  const handleCreateImprovement = () => {
    setIsCreating(true);
  };

  const handleFormCancel = () => {
    setIsCreating(false);
  };

  const handleFormSuccess = () => {
    setIsCreating(false);
  };

  return (
    <>
      <Helmet>
        <title>Improvement Management | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        {isCreating ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Improvement</h1>
            <ImprovementForm 
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Improvement Management</h1>
                <p className="text-gray-600 mt-1">
                  Track and implement service improvements
                </p>
              </div>
              
              {canCreateImprovement && (
                <Button
                  variant="default"
                  onClick={handleCreateImprovement}
                  className="flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  New Improvement
                </Button>
              )}
            </div>
            
            <ImprovementList showFilters={true} />
          </>
        )}
      </div>
    </>
  );
};

export default ImprovementsPage;
