import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORIES, TransactionType } from '../types';

export const AddTransaction: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addTransaction, updateTransaction, state } = useApp();
  
  const editId = params.get('edit');
  const typeParam = params.get('type');
  
  // Determine initial type (fallback to INCOME)
  const [currentType, setCurrentType] = useState<TransactionType>(
    (typeParam === 'EXPENSE' ? 'EXPENSE' : 'INCOME')
  );

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    accountId: state.accounts[0]?.id || ''
  });

  // Ensure accountId is valid
  useEffect(() => {
    if (!formData.accountId && state.accounts.length > 0) {
      setFormData(prev => ({ ...prev, accountId: state.accounts[0].id }));
    }
  }, [state.accounts, formData.accountId]);

  // Load data if editing
  useEffect(() => {
    if (editId) {
      const tx = state.transactions.find(t => t.id === editId);
      if (tx) {
        setFormData({
          amount: tx.amount.toString(),
          category: tx.category,
          date: tx.date.split('T')[0],
          notes: tx.notes || '',
          accountId: tx.accountId
        });
        setCurrentType(tx.type);
      } else {
        navigate('/transactions');
      }
    } else {
        // Set default category
        const defaults = currentType === 'INCOME' ? state.settings.categories.income : state.settings.categories.expense;
        setFormData(prev => ({ ...prev, category: defaults[0] }));
    }
  }, [editId, state.transactions, navigate, currentType, state.settings.categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    const payload = {
      amount: parseFloat(formData.amount),
      type: currentType,
      category: formData.category,
      date: formData.date,
      notes: formData.notes,
      accountId: formData.accountId,
    };

    if (editId) {
      // Preserve relatedLoanId if this transaction is linked to a loan
      const existingTx = state.transactions.find(t => t.id === editId);
      updateTransaction({
        id: editId,
        ...payload,
        relatedLoanId: existingTx?.relatedLoanId
      });
    } else {
      addTransaction({
        id: `tx_${Date.now()}`,
        ...payload
      });
    }

    navigate('/transactions');
  };

  const categories = currentType === 'INCOME' 
    ? state.settings.categories.income 
    : state.settings.categories.expense;

  const isEditing = !!editId;

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
       <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
         {isEditing ? (
            <span className="text-blue-500">Edit Transaction</span>
         ) : (
             currentType === 'INCOME' ? (
               <span className="text-emerald-500">Add Income</span>
             ) : (
               <span className="text-red-500">Add Expense</span>
             )
         )}
       </h2>

       <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
            <input 
              type="number" 
              step="0.01" 
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-xl font-mono"
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select 
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {!categories.includes(formData.category) && formData.category && (
                     <option value={formData.category}>{formData.category}</option>
                  )}
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input 
                  type="date"
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account</label>
             <select 
               className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
               value={formData.accountId}
               onChange={e => setFormData({...formData, accountId: e.target.value})}
             >
               {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
            <textarea 
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="E.g., Dinner with friends..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Attachment</label>
            <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
             <button type="submit" className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/30">
               {isEditing ? 'Update Transaction' : 'Save Transaction'}
             </button>
          </div>
       </form>
    </div>
  );
};