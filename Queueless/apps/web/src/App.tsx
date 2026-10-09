import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ActiveBranchProvider } from './context/ActiveBranchContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveQueue from './pages/LiveQueue';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import PublicDisplay from './pages/PublicDisplay';
import JoinRedirect from './pages/JoinRedirect';
import QrManagement from './pages/QrManagement';
import Kiosk from './pages/Kiosk';
import CustomerPortal from './pages/CustomerPortal';
import Analytics from './pages/Analytics';
import Organizations from './pages/Organizations';
import QueuesOversight from './pages/QueuesOversight';
import PlatformStaff from './pages/PlatformStaff';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import './App.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '8px', margin: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Something went wrong</h1>
          <p>The application encountered an unexpected error.</p>
          <pre style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '4px', marginTop: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading QueueLess...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Landing />;
  }
  return <Layout />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ActiveBranchProvider>
            <BrowserRouter basename={process.env.PUBLIC_URL || ''}>
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/showcase" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/join/:token" element={<JoinRedirect />} />
                <Route path="/join" element={<JoinRedirect />} />
                <Route path="/display" element={<PublicDisplay />} />
                <Route path="/display/:branchId" element={<PublicDisplay />} />
                <Route path="/lobby" element={<PublicDisplay />} />
                <Route path="/lobby/:branchId" element={<PublicDisplay />} />
                <Route path="/kiosk" element={<Kiosk />} />
                <Route path="/kiosk/:branchId" element={<Kiosk />} />
                <Route path="/customer-portal" element={<CustomerPortal />} />
                <Route path="/" element={<RootRoute />}>
                  <Route index element={<Dashboard />} />
                  <Route path="organizations" element={<Organizations />} />
                  <Route path="queues" element={<QueuesOversight />} />
                  <Route path="staff" element={<PlatformStaff />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="live-queue" element={<LiveQueue />} />
                  <Route path="qr-management" element={<QrManagement />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ActiveBranchProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
