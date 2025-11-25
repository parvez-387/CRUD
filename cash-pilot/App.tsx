import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { TransactionList } from './screens/TransactionList';
import { AddTransaction } from './screens/AddTransaction';
import { Loans } from './screens/Loans';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';
import { Auth } from './screens/Auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
         <Loader2 className="animate-spin text-primary mb-2" size={40} />
         <p className="text-slate-500 font-medium">Loading Safe Storage...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/add" element={<AddTransaction />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
          <ProtectedRoute>
             <AppRoutes />
          </ProtectedRoute>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
