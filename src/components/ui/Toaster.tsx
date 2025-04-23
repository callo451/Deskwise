import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#333333',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.375rem',
          padding: '0.75rem 1rem',
        },
        success: {
          style: {
            borderLeft: '4px solid #10b981',
          },
        },
        error: {
          style: {
            borderLeft: '4px solid #ef4444',
          },
        },
      }}
    />
  );
};
