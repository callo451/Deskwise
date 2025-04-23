import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import ProblemList from '../components/problems/ProblemList';
import ProblemForm from '../components/problems/ProblemForm';
import { Button } from '../components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

const ProblemsPage: React.FC = () => {

  const [isCreating, setIsCreating] = useState(false);

  return (
    <>
      <Helmet>
        <title>Problem Management | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        {isCreating ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Problem</h1>
            <ProblemForm 
              onCancel={() => setIsCreating(false)} 
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Problem Management</h1>
                <p className="text-gray-600 mt-1">
                  Identify, track, and resolve underlying causes of incidents
                </p>
              </div>
              <Button 
                variant="default" 
                onClick={() => setIsCreating(true)}
                className="flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                New Problem
              </Button>
            </div>
            <ProblemList />
          </>
        )}
      </div>
    </>
  );
};

export default ProblemsPage;
