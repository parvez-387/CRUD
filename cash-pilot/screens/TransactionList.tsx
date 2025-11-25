import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Trash2, Pencil, Calendar } from 'lucide-react';
import { TransactionType } from '../types';
import { useNavigate } from 'react-router-dom';

type DateFilter = 'LAST_7_DAYS' | 'LAST_MONTH' | 'LAST_YEAR' | 'CURRENT_YEAR' | 'ALL' | 'CUSTOM';

export const TransactionList: React.FC = () => {
  const { state, deleteTransaction } = useApp();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<TransactionType | 'ALL' | 'REPAYMENT'>('ALL');
  const [search, setSearch] = useState('');
  
  // Date Filtering
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return state.transactions.filter(t => {
      // 1. Filter by Type
      let matchesType = true;
      if (filterType === 'REPAYMENT') {
        matchesType = !!t.relatedLoanId;
      } else if (filterType !== 'ALL') {
        matchesType = t.type === filterType;
      }

      // 2. Filter by Search
      const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase()) || 
                            (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
      
      // 3. Filter by Date
      let matchesDate = true;
      const tDate = new Date(t.date);
      switch (dateFilter) {
        case 'LAST_7_DAYS': {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDate = tDate >= sevenDaysAgo;
          break;
        }
        case 'LAST_MONTH': {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);
          matchesDate = tDate >= oneMonthAgo;
          break;
        }
        case 'LAST_YEAR': {
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          matchesDate = tDate >= oneYearAgo;
          break;
        }
        case 'CURRENT_YEAR': {
          matchesDate = tDate.getFullYear() === today.getFullYear();
          break;
        }
        case 'CUSTOM': {
           if (customStart && customEnd) {
             const start = new Date(customStart);
             const end = new Date(customEnd);
             end.setHours(23, 59, 59, 999);
             matchesDate = tDate >= start && tDate <= end;
           }
           break;
        }
        case 'ALL':
        default:
          matchesDate = true;
      }

      return matchesType && matchesSearch && matchesDate;
    });
  }, [state.transactions, filterType, search, dateFilter, customStart, customEnd]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault(); 
    if (window.confirm('Delete this transaction? This will revert the balance and any linked loan repayment status.')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-40 md:w-auto"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               
               {/* Type Filter */}
               <select 
                 className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value as any)}
               >
                 <option value="ALL">All Types</option>
                 <option value="INCOME">Income</option>
                 <option value="EXPENSE">Expense</option>
                 <option value="REPAYMENT">Repayment</option>
               </select>

               {/* Date Filter */}
               <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Calendar size={16} className="text-slate-500" />
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        className="bg-transparent py-2 text-sm focus:outline-none text-slate-700 dark:text-slate-200"
                    >
                        <option value="ALL">All Time</option>
                        <option value="LAST_7_DAYS">Last 7 Days</option>
                        <option value="LAST_MONTH">Last Month</option>
                        <option value="CURRENT_YEAR">Current Year</option>
                        <option value="LAST_YEAR">Last Year</option>
                        <option value="CUSTOM">Custom Range</option>
                    </select>
               </div>
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === 'CUSTOM' && (
                <div className="flex gap-2 items-center md:self-end">
                    <span className="text-xs text-slate-500">From:</span>
                    <input 
                       type="date" 
                       className="p-1 rounded border border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800"
                       value={customStart}
                       onChange={e => setCustomStart(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">To:</span>
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

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Category</th>
              <th className="p-4">Notes</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                <td className="p-4 text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                     tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' :
                     tx.type === 'EXPENSE' ? 'bg-red-100 text-red-700' :
                     'bg-blue-100 text-blue-700'
                  }`}>
                    {tx.relatedLoanId ? 'LOAN / REPAY' : tx.type}
                  </span>
                  <div className="mt-1">{tx.category}</div>
                </td>
                <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{tx.notes || '-'}</td>
                <td className={`p-4 text-right font-bold ${
                   tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
                }`}>
                   {tx.type === 'INCOME' ? '+' : '-'}{state.settings.currency} {tx.amount.toFixed(2)}
                </td>
                <td className="p-4 text-center">
                   <div className="flex items-center justify-center gap-2">
                     <button 
                       onClick={() => navigate(`/add?edit=${tx.id}`)}
                       className="text-slate-400 hover:text-blue-500 transition p-2"
                       title="Edit"
                     >
                       <Pencil size={16} />
                     </button>
                     <button 
                       onClick={(e) => handleDelete(e, tx.id)}
                       className="text-slate-400 hover:text-red-500 transition p-2"
                       title="Delete"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};