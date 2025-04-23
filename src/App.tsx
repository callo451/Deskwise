import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage';
import SettingsPage from './pages/SettingsPage';
import TicketSettingsPage from './pages/TicketSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import QueuesPage from './pages/QueuesPage';
import QueuePage from './pages/QueuePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import KnowledgeBaseArticlePage from './pages/KnowledgeBaseArticlePage';
import KnowledgeBaseEditorPage from './pages/KnowledgeBaseEditorPage';
import KnowledgeBaseCategoriesPage from './pages/KnowledgeBaseCategoriesPage';
import ReportsPage from './pages/ReportsPage';
import SelfServicePortalPage from './pages/SelfServicePortalPage';
import ServiceRequestPage from './pages/ServiceRequestPage';

// ITIL Service Management Modules
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import ChangesPage from './pages/ChangesPage';
import ChangeDetailPage from './pages/ChangeDetailPage';
// Import the Improvement Management pages
const ImprovementsPage = React.lazy(() => import('./pages/ImprovementsPage'));
const ImprovementDetailPage = React.lazy(() => import('./pages/ImprovementDetailPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="signin" element={<SignInPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="verification" element={<VerificationPage />} />
            
            {/* Protected Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Ticket Management Routes */}
            <Route path="tickets" element={
              <ProtectedRoute>
                <TicketsPage />
              </ProtectedRoute>
            } />
            <Route path="tickets/new" element={
              <ProtectedRoute>
                <CreateTicketPage />
              </ProtectedRoute>
            } />
            <Route path="tickets/:id" element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            } />
            <Route path="services" element={
              <ProtectedRoute>
                <SelfServicePortalPage />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId/request" element={
              <ProtectedRoute>
                <ServiceRequestPage />
              </ProtectedRoute>
            } />
            <Route path="portal" element={
              <SelfServicePortalPage />
            } />
            <Route path="knowledge-base" element={
              <ProtectedRoute>
                <KnowledgeBasePage />
              </ProtectedRoute>
            } />
            <Route path="knowledge-base/article/:id" element={
              <ProtectedRoute>
                <KnowledgeBaseArticlePage />
              </ProtectedRoute>
            } />
            <Route path="knowledge-base/new" element={
              <ProtectedRoute>
                <KnowledgeBaseEditorPage />
              </ProtectedRoute>
            } />
            <Route path="knowledge-base/edit/:id" element={
              <ProtectedRoute>
                <KnowledgeBaseEditorPage />
              </ProtectedRoute>
            } />
            <Route path="knowledge-base/categories" element={
              <ProtectedRoute>
                <KnowledgeBaseCategoriesPage />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="settings/tickets" element={
              <ProtectedRoute>
                <TicketSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="settings/portal" element={
              <ProtectedRoute>
                <SettingsPage activeTab="portal" />
              </ProtectedRoute>
            } />
            <Route path="settings/service-catalog" element={
              <ProtectedRoute>
                <SettingsPage activeTab="service-catalog" />
              </ProtectedRoute>
            } />
            <Route path="settings/users" element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="settings/profile" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path="queues" element={
              <ProtectedRoute>
                <QueuesPage />
              </ProtectedRoute>
            } />
            <Route path="queues/:id" element={
              <ProtectedRoute>
                <QueuePage />
              </ProtectedRoute>
            } />
            
            {/* ITIL Service Management Routes */}
            {/* Problem Management Routes */}
            <Route path="problems" element={
              <ProtectedRoute>
                <ProblemsPage />
              </ProtectedRoute>
            } />
            <Route path="problems/:id" element={
              <ProtectedRoute>
                <ProblemDetailPage />
              </ProtectedRoute>
            } />
            
            {/* Change Management Routes */}
            <Route path="changes" element={
              <ProtectedRoute>
                <ChangesPage />
              </ProtectedRoute>
            } />
            <Route path="changes/:id" element={
              <ProtectedRoute>
                <ChangeDetailPage />
              </ProtectedRoute>
            } />
            
            {/* Improvement Management Routes */}
            <Route path="improvements" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <ImprovementsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="improvements/:id" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <ImprovementDetailPage />
                </Suspense>
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}

export default App;
