import React from 'react';
import { SavedBill } from '../types';
import { Button } from './Button';
import { Icons } from '../constants';

interface HistoryProps {
  bills: SavedBill[];
  onBack: () => void;
  onClear: () => void;
}

export const History: React.FC<HistoryProps> = ({ bills, onBack, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-12 pb-6 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
            <Icons.ChevronLeft />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Past Tabs</h2>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {bills.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Icons.History />
            </div>
            <p className="text-lg font-medium text-slate-600">No history yet</p>
            <p className="text-sm text-slate-400">Your past bills will show up here.</p>
          </div>
        ) : (
          bills.map(bill => (
            <div key={bill.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800">{bill.storeName}</h3>
                  <p className="text-xs text-slate-400">{bill.date}</p>
                </div>
                <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                  ${bill.total.toFixed(2)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-500">
                <span>{bill.attendees.length} people</span>
                <span>Split successfully</span>
              </div>
            </div>
          ))
        )}
      </div>

      {bills.length > 0 && (
         <div className="p-6 bg-white border-t border-slate-100">
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" fullWidth onClick={onClear}>
                Clear History
            </Button>
         </div>
      )}
    </div>
  );
};