import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { exportData, exportCSV, getStorageUsage, removePin, setPin, importData } from '../services/db';
import { Download, Trash, Moon, Sun, Plus, X, CreditCard, Tag, Database, HardDrive, Shield, KeyRound, LogOut, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const { state, updateSettings, addCategory, removeCategory, addAccount, removeAccount, logout, hasPinSetup, refreshState } = useApp();
  
  // Local state for inputs
  const [newCatIncome, setNewCatIncome] = useState('');
  const [newCatExpense, setNewCatExpense] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CATEGORIES' | 'ACCOUNTS' | 'SECURITY'>('GENERAL');
  
  // Storage usage
  const [usage, setUsage] = useState('Calculating...');
  
  // Security
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [securityMsg, setSecurityMsg] = useState('');

  // Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     getStorageUsage().then(setUsage);
  }, [activeTab]);

  const handleClearData = async () => {
    if (confirm("Are you sure? This will wipe all data permanently. This cannot be undone.")) {
      // Clear IDB
      const req = indexedDB.deleteDatabase('CashPilotDB');
      req.onsuccess = async () => {
          await refreshState();
          alert("Data cleared.");
      };
      req.onerror = () => alert("Could not delete database. Please clear browser data manually.");
    }
  };
  
  const handleChangePin = async () => {
      if (newPin.length < 4 || newPin !== confirmNewPin) {
          setSecurityMsg("PIN must be 4+ digits and match.");
          return;
      }
      await setPin(newPin);
      setSecurityMsg("PIN updated successfully.");
      setNewPin('');
      setConfirmNewPin('');
  };
  
  const handleRemovePin = async () => {
      if (confirm("Remove PIN protection? Anyone with access to this device can view your data.")) {
          await removePin();
          // We force a refresh to update auth state internally if needed, 
          // though pin state is usually checked on mount.
          // For now just reloading state is enough.
          await refreshState();
          alert("PIN removed.");
          // We can optionally force logout to test, but it's better to stay logged in.
      }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (confirm("This will OVERWRITE all your current data with the backup. This cannot be undone. Continue?")) {
          try {
              await importData(file);
              await refreshState();
              alert("Data restored successfully.");
          } catch (err) {
              alert("Failed to import data. Please check the file format.");
          }
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {[
            { id: 'GENERAL', label: 'General' },
            { id: 'CATEGORIES', label: 'Categories' },
            { id: 'ACCOUNTS', label: 'Accounts' },
            { id: 'SECURITY', label: 'Security' }
        ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              {tab.label}
            </button>
        ))}
      </div>

      {/* GENERAL TAB */}
      {activeTab === 'GENERAL' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Appearance */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <Sun size={20} className="text-amber-500" /> Appearance
             </h3>
             <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <button 
                   onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
                   className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${state.settings.darkMode ? 'bg-primary' : 'bg-slate-300'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${state.settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>
          </section>

          {/* Preferences */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4">Preferences</h3>
             <div>
                <label className="block text-sm font-medium mb-1">Default Currency</label>
                <select 
                   className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                   value={state.settings.currency}
                   onChange={(e) => updateSettings({ currency: e.target.value })}
                >
                   <option value="USD">USD ($)</option>
                   <option value="EUR">EUR (€)</option>
                   <option value="GBP">GBP (£)</option>
                   <option value="INR">INR (₹)</option>
                   <option value="JPY">JPY (¥)</option>
                </select>
             </div>
          </section>

          {/* Data Management */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
               <Database size={20} /> Data Management
             </h3>
             
             {/* Database Status Info */}
             <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                   <HardDrive className="text-emerald-600 dark:text-emerald-400 mt-1" size={20} />
                   <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Device Storage (IndexedDB)</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        Your data is stored securely in your browser's internal database. It is fast and offline-ready.
                      </p>
                      <p className="text-xs font-mono mt-2 text-emerald-500">
                        Estimated Size: {usage}
                      </p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={exportData} className="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">
                   <Download size={18} /> Backup Data (.json)
                </button>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleImport} 
                />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">
                   <Upload size={18} /> Import Backup (.json)
                </button>
                
                <button onClick={exportCSV} className="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">
                   <Download size={18} /> Export Transactions (.csv)
                </button>
             </div>
             <button onClick={handleClearData} className="w-full mt-4 flex items-center justify-center gap-2 p-3 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm">
                <Trash size={18} /> Factory Reset (Wipe All)
             </button>
          </section>
        </div>
      )}
      
      {/* SECURITY TAB */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
               <Shield size={20} /> Security Settings
             </h3>
             
             <div className="mb-6">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm"><KeyRound size={16}/> {hasPinSetup ? "Change PIN" : "Set New PIN"}</h4>
                <div className="flex flex-col gap-3 max-w-xs">
                    <input 
                       type="password" 
                       pattern="[0-9]*" inputMode="numeric"
                       placeholder="New PIN (4+ digits)"
                       className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                       value={newPin}
                       onChange={e => setNewPin(e.target.value)}
                    />
                    <input 
                       type="password" 
                       pattern="[0-9]*" inputMode="numeric"
                       placeholder="Confirm PIN"
                       className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                       value={confirmNewPin}
                       onChange={e => setConfirmNewPin(e.target.value)}
                    />
                    <button onClick={handleChangePin} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Update PIN</button>
                    {securityMsg && <p className="text-sm text-emerald-500">{securityMsg}</p>}
                </div>
             </div>
             
             {hasPinSetup && (
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                     <button onClick={handleRemovePin} className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2">
                        <Trash size={16}/> Remove PIN Protection
                     </button>
                 </div>
             )}
             
             <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <button onClick={logout} className="w-full p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2">
                    <LogOut size={18}/> Logout Now
                 </button>
             </div>
           </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Income Categories */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 text-emerald-600 flex items-center gap-2">
               <Tag size={18} /> Income Categories
             </h3>
             <div className="flex gap-2 mb-4">
               <input 
                 type="text" 
                 className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-700 text-sm"
                 placeholder="New Income Category"
                 value={newCatIncome}
                 onChange={e => setNewCatIncome(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && newCatIncome) {
                     addCategory('income', newCatIncome);
                     setNewCatIncome('');
                   }
                 }}
               />
               <button 
                 onClick={() => { if(newCatIncome) { addCategory('income', newCatIncome); setNewCatIncome(''); } }}
                 className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700"
               >
                 <Plus size={20} />
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {state.settings.categories.income.map(cat => (
                 <span key={cat} className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-sm flex items-center gap-2 group">
                   {cat}
                   <button onClick={() => removeCategory('income', cat)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200">
                     <X size={14} />
                   </button>
                 </span>
               ))}
             </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2">
               <Tag size={18} /> Expense Categories
             </h3>
             <div className="flex gap-2 mb-4">
               <input 
                 type="text" 
                 className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-700 text-sm"
                 placeholder="New Expense Category"
                 value={newCatExpense}
                 onChange={e => setNewCatExpense(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && newCatExpense) {
                     addCategory('expense', newCatExpense);
                     setNewCatExpense('');
                   }
                 }}
               />
               <button 
                 onClick={() => { if(newCatExpense) { addCategory('expense', newCatExpense); setNewCatExpense(''); } }}
                 className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
               >
                 <Plus size={20} />
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {state.settings.categories.expense.map(cat => (
                 <span key={cat} className="px-3 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm flex items-center gap-2">
                   {cat}
                   <button onClick={() => removeCategory('expense', cat)} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
                     <X size={14} />
                   </button>
                 </span>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2">
               <CreditCard size={18} /> Manage Accounts
             </h3>
             
             {/* Add Account */}
             <div className="flex flex-col md:flex-row gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
               <input 
                 type="text" 
                 className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-700 text-sm"
                 placeholder="Account Name (e.g., Bank, Wallet)"
                 value={newAccName}
                 onChange={e => setNewAccName(e.target.value)}
               />
               <select
                  className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 text-sm"
                  value={newAccCurrency}
                  onChange={e => setNewAccCurrency(e.target.value)}
               >
                 <option value="USD">USD</option>
                 <option value="EUR">EUR</option>
                 <option value="GBP">GBP</option>
                 <option value="INR">INR</option>
               </select>
               <button 
                 onClick={() => { if(newAccName) { addAccount(newAccName, newAccCurrency); setNewAccName(''); } }}
                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
               >
                 Add Account
               </button>
             </div>

             {/* List Accounts */}
             <div className="space-y-3">
               {state.accounts.map(acc => (
                 <div key={acc.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                    <div>
                      <p className="font-bold">{acc.name}</p>
                      <p className="text-xs text-slate-500">Balance: {acc.currency} {acc.balance.toFixed(2)}</p>
                    </div>
                    {state.accounts.length > 1 && (
                      <button 
                        onClick={() => { if(confirm(`Delete account "${acc.name}"? Transactions will remain but balance history might be affected.`)) removeAccount(acc.id) }} 
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">Cash Pilot v1.3.0 • Secured with IndexedDB</p>
    </div>
  );
};