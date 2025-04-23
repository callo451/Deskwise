import React from 'react';
import { Link } from 'react-router-dom';
import SignInForm from '../components/auth/SignInForm';

const SignInPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <SignInForm />
        <div className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
