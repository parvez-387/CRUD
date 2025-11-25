import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup, hasPinSetup } = useApp();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(pin);
    if (!success) setError("Incorrect PIN");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
        setError("PIN must be at least 4 digits");
        return;
    }
    if (pin !== confirmPin) {
        setError("PINs do not match");
        return;
    }
    await signup(pin);
  };

  if (!hasPinSetup) {
      // Signup Mode
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Secure Your Data</h2>
                <p className="text-slate-500 mb-6">Create a PIN to protect your financial information on this device.</p>
                
                <form onSubmit={handleSignup} className="space-y-4">
                    <input 
                        type="password" 
                        inputMode="numeric" 
                        pattern="[0-9]*"
                        placeholder="Create PIN" 
                        className="w-full text-center text-2xl tracking-widest p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        autoFocus
                    />
                    <input 
                        type="password" 
                        inputMode="numeric" 
                        pattern="[0-9]*"
                        placeholder="Confirm PIN" 
                        className="w-full text-center text-2xl tracking-widest p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                        Set PIN & Start
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // Login Mode
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-500 mb-6">Enter your PIN to access Cash Pilot</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    inputMode="numeric"
                    placeholder="Enter PIN" 
                    className="w-full text-center text-2xl tracking-widest p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    autoFocus
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    Unlock <ArrowRight size={18}/>
                </button>
            </form>
        </div>
    </div>
  );
};
