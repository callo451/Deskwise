import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ImprovementDetail from '../components/improvements/ImprovementDetail';

const ImprovementDetailPage: React.FC = () => {
  useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/improvements');
  };

  return (
    <>
      <Helmet>
        <title>Improvement Details | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="mb-4 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Improvements
        </Button>
        
        {/* Pass the id parameter from the URL to the ImprovementDetail component */}
        <ImprovementDetail />
      </div>
    </>
  );
};

export default ImprovementDetailPage;
