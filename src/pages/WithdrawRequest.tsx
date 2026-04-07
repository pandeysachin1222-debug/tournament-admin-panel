import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, orderBy, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { FinancialRequest } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { ArrowUpCircle, Check, X, User, AlertCircle } from 'lucide-react';

export default function WithdrawRequests() {
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'withdraw_requests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRequest));
      setRequests(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'withdraw_requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request: FinancialRequest, action: 'approved' | 'rejected') => {
    if (processingId) return;
    setProcessingId(request.id);

    try {
      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, 'withdraw_requests', request.id);
        const userRef = doc(db, 'users', request.userId);

        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists()) throw new Error("Request does not exist!");
        
        // Prevent double approval
        if (requestDoc.data().status !== 'pending') {
          throw new Error("Request is no longer pending!");
        }

        if (action === 'approved') {
          // 1. Get userId (request.userId)
          // 2. Get amount (request.amount)
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User does not exist!");
          
          // 3. Check wallet balance
          const currentBalance = userDoc.data().walletBalance || 0;
          if (currentBalance < request.amount) {
            // If insufficient balance: show error and do not approve.
            throw new Error("Insufficient balance: User only has $" + currentBalance);
          }
          
          // 4. Deduct wallet: walletBalance = walletBalance - amount
          transaction.update(userRef, { walletBalance: currentBalance - request.amount });
        }

        // 5. Update withdraw_requests: status = "approved"
        transaction.update(requestRef, { 
          status: action,
          processedAt: new Date().toISOString()
        });
      });

      await fetchRequests();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Withdraw Requests</h2>
        <p className="text-zinc-400 mt-1">Review and process user withdrawal requests.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">UPI ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-zinc-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No requests found</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{req.userEmail}</p>
                          <p className="text-xs text-zinc-500">ID: {req.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-bold text-red-500">${req.amount}</td>
                    <td className="px-6 py-6 text-sm font-mono text-zinc-300">{req.upiId || 'N/A'}</td>
                    <td className="px-6 py-6 text-sm text-zinc-400">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        req.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                        req.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req, 'approved')}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              processingId === req.id 
                                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950"
                            )}
                          >
                            {processingId === req.id ? (
                              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req, 'rejected')}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              processingId === req.id 
                                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                                : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-zinc-950"
                            )}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
