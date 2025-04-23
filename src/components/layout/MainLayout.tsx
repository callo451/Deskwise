import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster } from '../ui/Toaster';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden pt-16">
        {user && <Sidebar />}
        <main className={`flex-1 overflow-auto p-6 ${user ? 'ml-64' : 'ml-0'}`}>
          <Outlet />
        </main>
      </div>
      <Toaster />  
    </div>
  );
};

export default MainLayout;
