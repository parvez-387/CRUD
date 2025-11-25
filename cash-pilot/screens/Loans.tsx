import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Loan, LoanType } from '../types';

export const Loans: React.FC = () => {
  const { state, addLoan, addRepayment } = useApp();
  const [params, setParams] = useSearchParams();
  
  const showForm = params.get('action')?.startsWith('new');
  const formType = params.get('action') === 'new_taken' ? 'TAKEN' : 'GIVEN';

  const [formData, setFormData] = useState<Partial<Loan>>({
    principal: 0,
    interestRate: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    counterparty: '',
    notes: ''
  });

  const [repayAmount, setRepayAmount] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.principal || !formData.counterparty) return;

    addLoan({
      id: `loan_${Date.now()}`,
      type: formType as LoanType,
      counterparty: formData.counterparty,
      principal: Number(formData.principal),
      interestRate: Number(formData.interestRate),
      startDate: formData.startDate!,
      dueDate: formData.dueDate!,
      status: 'ACTIVE',
      notes: formData.notes,
      repayments: []
    });
    
    setParams({});
    setFormData({
        principal: 0, interestRate: 0, startDate: new Date().toISOString().split('T')[0], dueDate: '', counterparty: '', notes: ''
    });
  };

  const handleRepay = (loanId: string) => {
    if (!repayAmount) return;
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) return;

    addRepayment(loanId, {
      id: `rep_${Date.now()}`,
      amount: parseFloat(repayAmount),
      type: 'REPAYMENT', // Will be adjusted in context
      category: 'Loan Repayment',
      date: new Date().toISOString(),
      accountId: state.accounts[0].id,
      notes: `Repayment for ${loan.counterparty}`
    });
    setRepayAmount('');
    setSelectedLoanId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Loans Management</h2>
        <div className="flex gap-2">
          <button onClick={() => setParams({ action: 'new_given' })} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} /> Lend Given
          </button>
          <button onClick={() => setParams({ action: 'new_taken' })} className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700">
            <Plus size={16} /> Lend Taken
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-in slide-in-from-top-4">
           <h3 className="text-lg font-bold mb-4">Record Loan {formType}</h3>
           <form onSubmit={handleSaveLoan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="Counterparty Name (e.g. John Doe)" className="p-3 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.counterparty} onChange={e => setFormData({...formData, counterparty: e.target.value})} required />
                 <input type="number" placeholder="Principal Amount" className="p-3 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.principal || ''} onChange={e => setFormData({...formData, principal: parseFloat(e.target.value)})} required />
                 <input type="number" placeholder="Interest Rate %" className="p-3 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.interestRate || ''} onChange={e => setFormData({...formData, interestRate: parseFloat(e.target.value)})} />
                 <div className="flex gap-2">
                    <input type="date" placeholder="Start Date" className="p-3 border rounded-lg w-full dark:bg-slate-900 dark:border-slate-700" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                    <input type="date" placeholder="Due Date" className="p-3 border rounded-lg w-full dark:bg-slate-900 dark:border-slate-700" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
                 </div>
              </div>
              <textarea placeholder="Notes" className="w-full p-3 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              <div className="flex gap-2">
                 <button type="button" onClick={() => setParams({})} className="px-4 py-2 text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg">Save Loan</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
         {state.loans.map(loan => {
            const totalRepaid = state.transactions
              .filter(t => loan.repayments.includes(t.id))
              .reduce((sum, t) => sum + t.amount, 0);
            const totalDue = loan.principal * (1 + loan.interestRate / 100);
            const progress = Math.min((totalRepaid / totalDue) * 100, 100);
            const isOverdue = loan.status === 'ACTIVE' && new Date(loan.dueDate) < new Date();

            return (
              <div key={loan.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                          loan.type === 'GIVEN' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                       }`}>{loan.type}</span>
                       <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                          loan.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                       }`}>{isOverdue ? 'OVERDUE' : loan.status}</span>
                    </div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <User size={18} className="text-slate-400" />
                      {loan.counterparty}
                    </h3>
                    <div className="text-sm text-slate-500 mt-1 flex gap-4">
                       <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                       <span>Rate: {loan.interestRate}%</span>
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                       <span>Progress</span>
                       <span className="font-bold">{state.settings.currency} {totalRepaid.toFixed(0)} / {totalDue.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                       <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                    {loan.status === 'ACTIVE' && (
                       selectedLoanId === loan.id ? (
                          <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               className="w-24 p-2 text-sm border rounded dark:bg-slate-900 dark:border-slate-700" 
                               placeholder="Amt"
                               value={repayAmount}
                               onChange={e => setRepayAmount(e.target.value)}
                             />
                             <button onClick={() => handleRepay(loan.id)} className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"><CheckCircle size={16}/></button>
                             <button onClick={() => setSelectedLoanId(null)} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">X</button>
                          </div>
                       ) : (
                          <button onClick={() => setSelectedLoanId(loan.id)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
                             Add Repayment
                          </button>
                       )
                    )}
                 </div>
              </div>
            );
         })}
         {state.loans.length === 0 && <div className="text-center p-8 text-slate-500">No loans recorded.</div>}
      </div>
    </div>
  );
};