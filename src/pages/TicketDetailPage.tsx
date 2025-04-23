import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ModernTicketDetail from '../components/tickets/ModernTicketDetail';

const TicketDetailPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/tickets');
  };

  return (
    <>
      <Helmet>
        <title>Ticket Details | DeskWise ITSM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="mb-4 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Tickets
        </Button>
        
        <ModernTicketDetail />
      </div>
    </>
  );
};

export default TicketDetailPage;
