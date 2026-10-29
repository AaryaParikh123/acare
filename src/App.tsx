import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ACListPage from './pages/ACListPage';
import ACFormPage from './pages/ACFormPage';
import ACDetailPage from './pages/ACDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import TaskFormPage from './pages/TaskFormPage';
import ServiceFormPage from './pages/ServiceFormPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import BuyingAssistantPage from './pages/BuyingAssistantPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />

            <Route path="/acs" element={
              <ProtectedRoute><ACListPage /></ProtectedRoute>
            } />
            <Route path="/acs/new" element={
              <ProtectedRoute><ACFormPage /></ProtectedRoute>
            } />
            <Route path="/acs/:id" element={
              <ProtectedRoute><ACDetailPage /></ProtectedRoute>
            } />
            <Route path="/acs/:id/edit" element={
              <ProtectedRoute><ACFormPage /></ProtectedRoute>
            } />

            <Route path="/maintenance" element={
              <ProtectedRoute><MaintenancePage /></ProtectedRoute>
            } />
            <Route path="/maintenance/task/new" element={
              <ProtectedRoute><TaskFormPage /></ProtectedRoute>
            } />
            <Route path="/maintenance/task/:id/edit" element={
              <ProtectedRoute><TaskFormPage /></ProtectedRoute>
            } />
            <Route path="/maintenance/service/new" element={
              <ProtectedRoute><ServiceFormPage /></ProtectedRoute>
            } />
            <Route path="/maintenance/expense/new" element={
              <ProtectedRoute><ExpenseFormPage /></ProtectedRoute>
            } />

            <Route path="/assistant" element={
              <ProtectedRoute><BuyingAssistantPage /></ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
