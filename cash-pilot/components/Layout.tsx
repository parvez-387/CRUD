import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, BarChart3, Settings, PlusCircle, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout } = useApp();
  const balance = state.accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Receipt, label: 'Transactions', to: '/transactions' },
    { icon: PiggyBank, label: 'Loans', to: '/loans' },
    { icon: BarChart3, label: 'Reports', to: '/reports' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="p-1 bg-primary text-white rounded">CP</span> Cash Pilot
          </h1>
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
             <p className="text-xs text-slate-500 dark:text-slate-400">Total Balance</p>
             <p className="text-xl font-bold">{state.settings.currency} {balance.toFixed(2)}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-danger transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Nav - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-3 z-50">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
        <header className="md:hidden bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-40">
           <h1 className="font-bold text-lg">Cash Pilot</h1>
           <span className="font-mono font-bold text-primary">{state.settings.currency} {balance.toFixed(2)}</span>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Floating Action Button for Mobile Add */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
         <NavLink to="/add" className="bg-primary text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition">
            <PlusCircle size={28} />
         </NavLink>
      </div>
    </div>
  );
};