import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const VerificationPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <div className="text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
        </p>
        <Button variant="outline" asChild className="mb-4">
          <Link to="/signin">Return to Sign In</Link>
        </Button>
        <p className="text-sm text-gray-500">
          Didn't receive an email? Check your spam folder or contact support.
        </p>
      </div>
    </div>
  );
};

export default VerificationPage;
