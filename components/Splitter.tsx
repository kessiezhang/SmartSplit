import React, { useState, useEffect, useMemo } from 'react';
import { ReceiptData, User, ItemClaims, CustomSplits, CalculationResult } from '../types';
import { Button } from './Button';
import { Icons, getRandomColor } from '../constants';

interface SplitterProps {
  receipt: ReceiptData;
  users: User[];
  claims: ItemClaims;
  customSplits: CustomSplits;
  tipPercentage: number;
  onUpdateClaims: (claims: ItemClaims) => void;
  onUpdateCustomSplits: (splits: CustomSplits) => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateTip: (tip: number) => void;
  onFinish: () => void;
}

export const Splitter: React.FC<SplitterProps> = ({
  receipt,
  users,
  claims,
  customSplits,
  tipPercentage,
  onUpdateClaims,
  onUpdateCustomSplits,
  onUpdateUsers,
  onUpdateTip,
  onFinish
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(users[0]?.id || null);
  const [showSummary, setShowSummary] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  // State for Manual Split Modal
  const [splittingItem, setSplittingItem] = useState<{id: string, name: string, price: number} | null>(null);
  const [tempSplitAmounts, setTempSplitAmounts] = useState<Record<string, string>>({}); // Use string for inputs

  // Auto-select first user if none selected
  useEffect(() => {
    if (!activeUserId && users.length > 0) {
      setActiveUserId(users[0].id);
    }
  }, [users, activeUserId]);

  const activeUser = users.find(u => u.id === activeUserId);

  // --- Handlers ---

  const handleClaim = (itemId: string) => {
    // If there is a custom split, standard claiming is disabled or resets it.
    // Let's make it so clicking the main card always toggles the active user. 
    // If a custom split existed, we clear it to revert to "even split" mode.
    
    if (!activeUserId) return;
    
    // Clear custom split if it exists for this item
    if (customSplits[itemId]) {
        const newCustomSplits = { ...customSplits };
        delete newCustomSplits[itemId];
        onUpdateCustomSplits(newCustomSplits);
    }

    const currentClaims = claims[itemId] || [];
    const isClaimed = currentClaims.includes(activeUserId);
    
    let newClaims;
    if (isClaimed) {
      newClaims = currentClaims.filter(id => id !== activeUserId);
    } else {
      newClaims = [...currentClaims, activeUserId];
    }

    onUpdateClaims({
      ...claims,
      [itemId]: newClaims
    });
  };

  const openSplitModal = (item: {id: string, name: string, price: number}) => {
    setSplittingItem(item);
    
    // Initialize inputs based on existing custom split OR even split
    const currentCustom = customSplits[item.id];
    const initialAmounts: Record<string, string> = {};
    
    if (currentCustom) {
        users.forEach(u => {
            initialAmounts[u.id] = (currentCustom[u.id] || 0).toString();
        });
    } else {
        users.forEach(u => {
            initialAmounts[u.id] = "0";
        });
    }
    setTempSplitAmounts(initialAmounts);
  };

  const handleSaveCustomSplit = () => {
      if (!splittingItem) return;

      const finalSplits: Record<string, number> = {};
      let totalAssigned = 0;

      users.forEach(u => {
          const val = parseFloat(tempSplitAmounts[u.id]) || 0;
          if (val > 0) {
              finalSplits[u.id] = val;
              totalAssigned += val;
          }
      });

      onUpdateCustomSplits({
          ...customSplits,
          [splittingItem.id]: finalSplits
      });
      setSplittingItem(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserName,
      avatarColor: getRandomColor(),
      isBirthday: false,
    };
    onUpdateUsers([...users, newUser]);
    setNewUserName('');
    setNewUserOpen(false);
    setActiveUserId(newUser.id);
  };

  const toggleBirthday = (userId: string) => {
    onUpdateUsers(users.map(u => ({
      ...u,
      isBirthday: u.id === userId ? !u.isBirthday : u.isBirthday
    })));
  };

  // --- Calculations ---
  const results = useMemo(() => {
    const userTotals: Record<string, number> = {};
    const itemDetails: Record<string, { name: string, cost: number }[]> = {};

    users.forEach(u => {
      userTotals[u.id] = 0;
      itemDetails[u.id] = [];
    });

    receipt.items.forEach(item => {
      const customSplit = customSplits[item.id];
      
      if (customSplit) {
          // Use custom split data
          Object.entries(customSplit).forEach(([uid, amount]) => {
              const val = amount as number;
              if (userTotals[uid] !== undefined) {
                  userTotals[uid] += val;
                  itemDetails[uid].push({ name: `${item.name} (partial)`, cost: val });
              }
          });
      } else {
          // Use standard even split logic
          const claimers = claims[item.id] || [];
          if (claimers.length > 0) {
            const splitPrice = item.price / claimers.length;
            claimers.forEach(uid => {
              if (userTotals[uid] !== undefined) {
                userTotals[uid] += splitPrice;
                itemDetails[uid].push({ name: item.name, cost: splitPrice });
              }
            });
          }
      }
    });

    // Birthday Logic
    const birthdayUsers = users.filter(u => u.isBirthday);
    const payingUsers = users.filter(u => !u.isBirthday);
    let redistributedAmount = 0;

    birthdayUsers.forEach(bUser => {
       redistributedAmount += userTotals[bUser.id];
       userTotals[bUser.id] = 0; 
    });

    if (payingUsers.length > 0 && redistributedAmount > 0) {
        const sharePerPerson = redistributedAmount / payingUsers.length;
        payingUsers.forEach(pUser => {
            userTotals[pUser.id] += sharePerPerson;
            itemDetails[pUser.id].push({ name: "🎉 Birthday Share", cost: sharePerPerson });
        });
    }

    // Tax and Tip
    const calculableSubtotal = users.reduce((sum, u) => sum + userTotals[u.id], 0) || 1; 
    const tipAmount = receipt.subtotal * (tipPercentage / 100);
    
    const calculationResults: CalculationResult[] = users.map(user => {
      const subtotal = userTotals[user.id];
      const ratio = subtotal / calculableSubtotal;
      const taxShare = receipt.tax * ratio;
      const tipShare = tipAmount * ratio;

      return {
        userId: user.id,
        subtotal,
        taxShare,
        tipShare,
        total: subtotal + taxShare + tipShare,
        items: itemDetails[user.id]
      };
    });

    return calculationResults;

  }, [receipt, users, claims, customSplits, tipPercentage]);


  // --- Render Summary View ---
  if (showSummary) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="px-6 py-8 bg-white shadow-sm sticky top-0 z-10">
          <button onClick={() => setShowSummary(false)} className="mb-4 flex items-center text-slate-500 hover:text-slate-800">
            <Icons.ChevronLeft /> <span className="ml-1 font-medium">Back to splitting</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Final Split</h1>
          <p className="text-slate-500">Total Bill: <span className="font-mono text-slate-900 font-bold">${(receipt.total + (receipt.subtotal * (tipPercentage/100))).toFixed(2)}</span></p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {results.map(res => {
            const user = users.find(u => u.id === res.userId);
            if (!user) return null;
            
            const isMe = user.id === 'u_1'; // Assuming u_1 is always 'Me'

            return (
              <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.avatarColor}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                           {user.name}
                           {user.isBirthday && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Birthday 🎂</span>}
                           {isMe && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">You</span>}
                        </p>
                      </div>
                   </div>
                   <p className="font-mono font-bold text-xl text-brand-600">${res.total.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-white">
                  <div className="space-y-2 mb-4">
                     {res.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between text-sm text-slate-600">
                         <span className="truncate pr-4">{item.name}</span>
                         <span className="font-mono text-slate-400">${item.cost.toFixed(2)}</span>
                       </div>
                     ))}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between mb-4">
                    <span>Tax: ${res.taxShare.toFixed(2)}</span>
                    <span>Tip: ${res.tipShare.toFixed(2)}</span>
                  </div>

                  {/* Actions for this user */}
                  {!isMe && res.total > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                          <button 
                             onClick={() => {
                                 const text = `Hey ${user.name}, you owe $${res.total.toFixed(2)} for ${receipt.storeName}.`;
                                 navigator.clipboard.writeText(text);
                                 alert("Copied breakdown to clipboard!");
                             }}
                             className="w-full bg-slate-100 text-slate-600 py-3 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                          >
                              <Icons.Share /> Copy Breakdown
                          </button>
                      </div>
                  )}
                  {isMe && (
                      <div className="text-center pt-2 border-t border-slate-100 text-sm text-slate-500 italic">
                          This is your portion.
                      </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
            <Button fullWidth onClick={onFinish} size="lg">Save & Finish</Button>
        </div>
      </div>
    );
  }

  // --- Render Splitter Main View ---

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm z-20 sticky top-0">
        <div className="px-4 py-4 flex justify-between items-center">
            <div>
               <h2 className="text-lg font-bold text-slate-900">{receipt.storeName}</h2>
               <p className="text-xs text-slate-500">{receipt.date}</p>
            </div>
            <div className="flex items-center gap-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tip %</label>
               <select 
                 className="bg-slate-100 border-none rounded-lg text-sm font-medium py-1 px-2 focus:ring-2 focus:ring-brand-500"
                 value={tipPercentage}
                 onChange={(e) => onUpdateTip(Number(e.target.value))}
               >
                 {[0, 10, 15, 18, 20, 25, 30].map(p => (
                   <option key={p} value={p}>{p}%</option>
                 ))}
               </select>
            </div>
        </div>

        {/* User Selector Scroll */}
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pb-4 items-center">
          {users.map(user => {
            const isActive = user.id === activeUserId;
            return (
              <button
                key={user.id}
                onClick={() => setActiveUserId(user.id)}
                className={`flex flex-col items-center flex-shrink-0 transition-all ${isActive ? 'scale-110' : 'opacity-60 scale-95'}`}
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-all ring-2 ring-offset-2 ${user.avatarColor} ${isActive ? 'ring-brand-500' : 'ring-transparent'}`}>
                  {user.name.charAt(0).toUpperCase()}
                  {user.isBirthday && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow"><Icons.Cake /></div>}
                </div>
                <span className="text-xs font-medium mt-1 text-slate-700 truncate max-w-[4rem]">{user.name}</span>
              </button>
            );
          })}
          
          <button 
            onClick={() => setNewUserOpen(true)}
            className="flex flex-col items-center flex-shrink-0 opacity-60 hover:opacity-100 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
              <Icons.Plus />
            </div>
            <span className="text-xs font-medium mt-1 text-slate-500">Add</span>
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {receipt.items.map((item) => {
          const customSplit = customSplits[item.id];
          const itemClaimers = claims[item.id] || [];
          const isClaimedByActive = !customSplit && activeUserId && itemClaimers.includes(activeUserId);
          const claimCount = customSplit ? Object.keys(customSplit).length : itemClaimers.length;
          
          return (
            <div key={item.id} className="relative group">
                <button
                onClick={() => handleClaim(item.id)}
                className={`w-full text-left bg-white p-4 rounded-xl border transition-all duration-200 relative overflow-hidden
                    ${isClaimedByActive 
                    ? 'border-brand-500 shadow-md ring-1 ring-brand-500' 
                    : customSplit ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 shadow-sm hover:border-brand-200'}`}
                >
                <div className="flex justify-between items-start z-10 relative">
                    <div className="flex-1 pr-10">
                    <h4 className={`font-medium text-base ${isClaimedByActive ? 'text-brand-700' : 'text-slate-800'}`}>
                        {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                        {customSplit ? (
                            <span className="text-indigo-600 font-medium">Custom split by amount</span>
                        ) : (
                            claimCount > 0 ? (
                            <span className="flex items-center gap-1">
                                {claimCount === 1 ? '1 person' : `${claimCount} people`} split
                                {claimCount > 1 && <span className="bg-slate-100 px-1 rounded text-slate-600 text-[10px] font-mono">${(item.price/claimCount).toFixed(2)}/ea</span>}
                            </span>
                            ) : 'Unclaimed'
                        )}
                    </p>
                    </div>
                    <span className={`font-mono font-bold text-lg ${isClaimedByActive ? 'text-brand-600' : 'text-slate-900'}`}>
                    ${item.price.toFixed(2)}
                    </span>
                </div>
                
                {/* Avatar Indicators for who claimed this */}
                <div className="flex -space-x-1 mt-3 relative z-10">
                    {customSplit 
                        ? Object.keys(customSplit).map(uid => {
                             const u = users.find(usr => usr.id === uid);
                             return u ? <div key={uid} className={`w-5 h-5 rounded-full border-2 border-white ${u.avatarColor}`} title={u.name} /> : null;
                          })
                        : itemClaimers.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            return u ? <div key={uid} className={`w-5 h-5 rounded-full border-2 border-white ${u.avatarColor}`} title={u.name} /> : null;
                        })
                    }
                </div>
                
                {isClaimedByActive && !customSplit && (
                    <div className="absolute top-0 right-0 p-1">
                    <div className="bg-brand-500 text-white rounded-bl-lg p-1 shadow-sm">
                        <div className="scale-75"><Icons.Check /></div>
                    </div>
                    </div>
                )}
                </button>

                {/* Manual Split Trigger */}
                <button 
                    onClick={(e) => { e.stopPropagation(); openSplitModal(item); }}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20"
                >
                    <Icons.MoreHorizontal />
                </button>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between text-white">
           <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Your Total</p>
              {activeUser ? (
                 <p className="font-mono text-2xl font-bold">
                    ${results.find(r => r.userId === activeUserId)?.total.toFixed(2) || "0.00"}
                 </p>
              ) : (
                <p className="text-sm text-slate-400">Select a user</p>
              )}
           </div>
           
           <div className="flex gap-3">
             {activeUser && (
               <button 
                  onClick={() => toggleBirthday(activeUser.id)}
                  className={`p-3 rounded-xl transition-colors ${activeUser.isBirthday ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title="Toggle Birthday Mode"
                >
                  <Icons.Cake />
               </button>
             )}
             <Button onClick={() => setShowSummary(true)} size="md">
               Review Split
             </Button>
           </div>
        </div>
      </div>

      {/* Add User Modal */}
      {newUserOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddUser} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
             <h3 className="text-lg font-bold mb-4">Add Friend</h3>
             <input 
               autoFocus
               type="text" 
               placeholder="Name (e.g. Alex)" 
               className="w-full text-lg border-b-2 border-slate-200 py-2 px-1 mb-6 focus:outline-none focus:border-brand-500 bg-transparent"
               value={newUserName}
               onChange={e => setNewUserName(e.target.value)}
             />
             <div className="flex gap-3">
               <Button type="button" variant="ghost" fullWidth onClick={() => setNewUserOpen(false)}>Cancel</Button>
               <Button type="submit" fullWidth disabled={!newUserName.trim()}>Add</Button>
             </div>
          </form>
        </div>
      )}

      {/* Manual Split Modal */}
      {splittingItem && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{splittingItem.name}</h3>
                        <p className="text-brand-600 font-mono font-bold">${splittingItem.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => setSplittingItem(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
                          <Icons.X />
                      </button>
                  </div>

                  <p className="text-sm text-slate-500 mb-4">
                      Enter the exact amount each person should pay for this item.
                  </p>

                  <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4 mb-6">
                      {users.map(u => (
                          <div key={u.id} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.avatarColor}`}>
                                  {u.name.charAt(0)}
                              </div>
                              <span className="flex-1 font-medium text-slate-700 truncate">{u.name}</span>
                              <div className="relative w-24">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                  <input 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono focus:border-brand-500 focus:outline-none"
                                      value={tempSplitAmounts[u.id] || ''}
                                      onChange={(e) => setTempSplitAmounts({...tempSplitAmounts, [u.id]: e.target.value})}
                                      placeholder="0.00"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Summary/Validation in Modal */}
                  <div className="bg-slate-50 p-4 rounded-xl mb-4 flex justify-between items-center text-sm">
                       <span className="text-slate-500">Assigned:</span>
                       <span className={`font-mono font-bold ${
                           Object.values(tempSplitAmounts).reduce<number>((a, b) => a + (parseFloat(b as string)||0), 0) > splittingItem.price + 0.01
                           ? "text-red-500" 
                           : "text-slate-900"
                       }`}>
                           ${Object.values(tempSplitAmounts).reduce<number>((a, b) => a + (parseFloat(b as string)||0), 0).toFixed(2)}
                           <span className="text-slate-400 font-normal"> / {splittingItem.price.toFixed(2)}</span>
                       </span>
                  </div>

                  <div className="flex gap-3">
                      <Button variant="ghost" fullWidth onClick={() => setSplittingItem(null)}>Cancel</Button>
                      <Button fullWidth onClick={handleSaveCustomSplit}>Save Split</Button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};