import React, { useState, useEffect, useRef } from 'react';
import { BillState, ReceiptData, User, ItemClaims, SavedBill } from './types';
import { parseReceiptImage } from './services/geminiService';
import { Splitter } from './components/Splitter';
import { History } from './components/History';
import { Button } from './components/Button';
import { Icons, getRandomColor } from './constants';

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state from local storage or defaults
  const [state, setState] = useState<BillState>(() => {
    const savedHistory = localStorage.getItem('tab_history');
    return {
      step: 'LANDING',
      receipt: null,
      imagePreview: null,
      users: [],
      claims: {},
      customSplits: {},
      tipPercentage: 18,
      history: savedHistory ? JSON.parse(savedHistory) : [],
    };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence for history
  useEffect(() => {
    localStorage.setItem('tab_history', JSON.stringify(state.history));
  }, [state.history]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    setState(prev => ({ ...prev, step: 'PARSING' }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setState(prev => ({ ...prev, imagePreview: base64String }));

      try {
        const receiptData = await parseReceiptImage(base64String);
        
        // Initialize with one user ("Me")
        const meUser: User = { 
          id: 'u_1', 
          name: 'Me', 
          avatarColor: getRandomColor(),
          isBirthday: false 
        };

        setState(prev => ({
          ...prev,
          step: 'SPLIT',
          receipt: receiptData,
          users: [meUser],
          claims: {},
          customSplits: {}
        }));
      } catch (err: any) {
        setError(err.message || "Failed to process receipt");
        setState(prev => ({ ...prev, step: 'LANDING' }));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinishSplit = () => {
    if (!state.receipt) return;
    
    // Calculate total including tip for history
    const tipAmount = state.receipt.subtotal * (state.tipPercentage / 100);
    const total = state.receipt.total + tipAmount;

    const newRecord: SavedBill = {
      id: Math.random().toString(36).substr(2, 9),
      date: state.receipt.date || new Date().toLocaleDateString(),
      storeName: state.receipt.storeName || 'Unknown Store',
      total: total,
      attendees: state.users.map(u => u.name)
    };

    setState(prev => ({
      ...prev,
      step: 'LANDING', // Go back to start
      history: [newRecord, ...prev.history],
      // Reset current session data
      receipt: null,
      imagePreview: null,
      users: [],
      claims: {},
      customSplits: {}
    }));
  };

  const clearHistory = () => {
      if(window.confirm("Are you sure you want to clear your history?")) {
          setState(prev => ({ ...prev, history: [] }));
      }
  };

  // --- Render Views ---

  if (state.step === 'PARSING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Receipt...</h2>
        <p className="text-slate-500 max-w-xs mx-auto">Gemini AI is reading your items, prices, and taxes. This usually takes a few seconds.</p>
        {state.imagePreview && (
            <div className="mt-8 relative w-48 h-64 rounded-xl overflow-hidden shadow-lg border border-slate-100 rotate-2">
                <img src={state.imagePreview} className="w-full h-full object-cover opacity-50 blur-sm" alt="Preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>
        )}
      </div>
    );
  }

  if (state.step === 'SPLIT' && state.receipt) {
    return (
      <Splitter 
        receipt={state.receipt}
        users={state.users}
        claims={state.claims}
        customSplits={state.customSplits}
        tipPercentage={state.tipPercentage}
        onUpdateClaims={(c) => setState(prev => ({ ...prev, claims: c }))}
        onUpdateCustomSplits={(c) => setState(prev => ({ ...prev, customSplits: c }))}
        onUpdateUsers={(u) => setState(prev => ({ ...prev, users: u }))}
        onUpdateTip={(t) => setState(prev => ({ ...prev, tipPercentage: t }))}
        onFinish={handleFinishSplit}
      />
    );
  }

  if (state.step === 'HISTORY') {
    return <History bills={state.history} onBack={() => setState(prev => ({ ...prev, step: 'LANDING' }))} onClear={clearHistory} />;
  }

  // Landing Screen
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
       {/* Decorative Background */}
       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-brand-200 rounded-full blur-[100px] opacity-40 pointer-events-none" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-indigo-200 rounded-full blur-[100px] opacity-40 pointer-events-none" />

       <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-brand-100 mb-8 rotate-[-3deg]">
             <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
             </div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Tab.</h1>
          <p className="text-lg text-slate-500 text-center max-w-xs leading-relaxed">
            The easiest way to split bills with friends. Snap a receipt, tap your items, done.
          </p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
               <span className="text-xl">!</span> {error}
            </div>
          )}

          <div className="mt-12 w-full max-w-xs space-y-4">
            <div className="relative">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <Button 
                size="lg" 
                fullWidth 
                onClick={() => fileInputRef.current?.click()}
                className="shadow-brand-300"
              >
                <div className="mr-2"><Icons.Camera /></div>
                Snap Receipt
              </Button>
            </div>

            <Button 
              variant="ghost" 
              fullWidth 
              onClick={() => setState(prev => ({ ...prev, step: 'HISTORY' }))}
            >
              <div className="mr-2"><Icons.History /></div>
              View Past Tabs
            </Button>
          </div>
       </div>

       <div className="p-6 text-center text-xs text-slate-400 z-10">
          Powered by Gemini AI • Version 1.0
       </div>
    </div>
  );
};

export default App;