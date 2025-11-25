import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Sparkles, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateFinancialAdvice } from '../services/geminiService';

type DateFilter = 'LAST_7_DAYS' | 'LAST_MONTH' | 'LAST_YEAR' | 'CURRENT_YEAR' | 'ALL' | 'CUSTOM';

export const Dashboard: React.FC = () => {
  const { state } = useApp();
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('LAST_7_DAYS');
  
  // Custom Date State
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter Transactions Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return state.transactions.filter(t => {
      const tDate = new Date(t.date);
      
      switch (dateFilter) {
        case 'LAST_7_DAYS': {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return tDate >= sevenDaysAgo;
        }
        case 'LAST_MONTH': {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);
          return tDate >= oneMonthAgo;
        }
        case 'LAST_YEAR': {
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          return tDate >= oneYearAgo;
        }
        case 'CURRENT_YEAR': {
          return tDate.getFullYear() === today.getFullYear();
        }
        case 'CUSTOM': {
           if (customStart && customEnd) {
             const start = new Date(customStart);
             const end = new Date(customEnd);
             // Include the end date fully
             end.setHours(23, 59, 59, 999);
             return tDate >= start && tDate <= end;
           }
           return true; // If incomplete, show all or none? Showing all for now
        }
        case 'ALL':
        default:
          return true;
      }
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, dateFilter, customStart, customEnd]);
  
  // Calculations based on filtered data
  const incomePeriod = filteredTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const expensePeriod = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

  const activeLoans = state.loans.filter(l => l.status === 'ACTIVE');
  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date());

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const advice = await generateFinancialAdvice(state);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'LAST_7_DAYS': return 'Last 7 Days';
      case 'LAST_MONTH': return 'Last Month';
      case 'LAST_YEAR': return 'Last Year';
      case 'CURRENT_YEAR': return 'This Year';
      case 'ALL': return 'All Time';
      case 'CUSTOM': return 'Custom Range';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
               <Calendar size={16} className="text-slate-500 ml-2" />
               <select 
                 value={dateFilter} 
                 onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                 className="bg-transparent text-sm font-medium focus:outline-none p-1 text-slate-700 dark:text-slate-200"
               >
                 <option value="LAST_7_DAYS">Last 7 Days</option>
                 <option value="LAST_MONTH">Last Month</option>
                 <option value="CURRENT_YEAR">Current Year</option>
                 <option value="LAST_YEAR">Last Year</option>
                 <option value="ALL">All Time</option>
                 <option value="CUSTOM">Custom Range</option>
               </select>
            </div>
            
            {/* Custom Range Inputs */}
            {dateFilter === 'CUSTOM' && (
                <div className="flex gap-2 animate-in fade-in">
                    <input 
                       type="date" 
                       className="p-1 rounded border border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800"
                       value={customStart}
                       onChange={e => setCustomStart(e.target.value)}
                    />
                    <span className="text-slate-400 self-center">-</span>
                    <input 
                       type="date" 
                       className="p-1 rounded border border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800"
                       value={customEnd}
                       onChange={e => setCustomEnd(e.target.value)}
                    />
                </div>
            )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition hover:shadow-md">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full">
               <ArrowUpRight size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 dark:text-slate-400">Income ({getFilterLabel()})</p>
               <p className="text-2xl font-bold text-emerald-600">+{state.settings.currency} {incomePeriod.toFixed(2)}</p>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition hover:shadow-md">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-red-100 dark:bg-red-900 text-red-600 rounded-full">
               <ArrowDownRight size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 dark:text-slate-400">Expense ({getFilterLabel()})</p>
               <p className="text-2xl font-bold text-red-600">-{state.settings.currency} {expensePeriod.toFixed(2)}</p>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition hover:shadow-md">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full">
               <Wallet size={24} />
             </div>
             <div>
               <p className="text-sm text-slate-500 dark:text-slate-400">Current Balance (Total)</p>
               <p className="text-2xl font-bold text-blue-600">
                 {state.settings.currency} {state.accounts.reduce((a,c) => a + c.balance, 0).toFixed(2)}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* AI Advisor Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <Sparkles size={100} />
         </div>
         <div className="relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              AI Financial Advisor
            </h3>
            <p className="mt-2 text-indigo-100 max-w-2xl">
              Get personalized insights about your spending habits and loan portfolio health powered by Gemini AI.
            </p>
            
            {aiAdvice && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-sm leading-relaxed whitespace-pre-wrap">
                {aiAdvice}
              </div>
            )}

            <button 
              onClick={handleGetAdvice}
              disabled={loadingAdvice}
              className="mt-4 px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {loadingAdvice ? 'Analyzing...' : aiAdvice ? 'Refresh Advice' : 'Ask AI Advisor'}
            </button>
         </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Link to="/add?type=INCOME" className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition">
            <ArrowUpRight />
            <span className="font-semibold">Add Income</span>
         </Link>
         <Link to="/add?type=EXPENSE" className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 transition">
            <ArrowDownRight />
            <span className="font-semibold">Add Expense</span>
         </Link>
         <Link to="/loans?action=new_given" className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
            <Activity />
            <span className="font-semibold">Lend Given</span>
         </Link>
         <Link to="/loans?action=new_taken" className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition">
            <Activity className="rotate-180" />
            <span className="font-semibold">Lend Taken</span>
         </Link>
      </div>

      {/* Loan Alerts */}
      {overdueLoans.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
           <h4 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2">
             <Activity size={18} />
             Attention: Overdue Loans Detected
           </h4>
           <ul className="list-disc list-inside mt-2 text-sm text-red-600 dark:text-red-300">
             {overdueLoans.map(l => (
               <li key={l.id}>{l.counterparty} - {state.settings.currency} {l.principal} (Due: {new Date(l.dueDate).toLocaleDateString()})</li>
             ))}
           </ul>
        </div>
      )}

      {/* Recent Transactions (Filtered) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg">Transactions ({getFilterLabel()})</h3>
           <Link to="/transactions" className="text-primary text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="space-y-4">
           {filteredTransactions.slice(0, 5).map(tx => (
             <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                   </div>
                   <div>
                      <p className="font-bold text-sm">{tx.category}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                   {tx.type === 'INCOME' ? '+' : '-'}{state.settings.currency} {tx.amount.toFixed(2)}
                </div>
             </div>
           ))}
           {filteredTransactions.length === 0 && (
             <p className="text-center text-slate-500 py-4">No transactions found for this period.</p>
           )}
        </div>
      </div>
    </div>
  );
};