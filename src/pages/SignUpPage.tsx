import React from 'react';
import { Link } from 'react-router-dom';
import SignUpForm from '../components/auth/SignUpForm';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <SignUpForm />
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
