import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, auth, adminEmails } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { Trophy, Users, ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecharge: 0,
    totalWithdraw: 0,
    totalProfit: 0,
    pendingWithdrawals: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email || !adminEmails.includes(user.email)) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    // 1. Total Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    // 2. Total Approved Recharge
    const unsubRecharge = onSnapshot(
      query(collection(db, 'recharge_requests'), where('status', '==', 'approved')), 
      (snap) => {
        let total = 0;
        snap.forEach(doc => total += doc.data().amount || 0);
        setStats(prev => ({ ...prev, totalRecharge: total }));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, 'recharge_requests')
    );

    // 3. Total Approved Withdraw
    const unsubWithdrawApproved = onSnapshot(
      query(collection(db, 'withdraw_requests'), where('status', '==', 'approved')), 
      (snap) => {
        let total = 0;
        snap.forEach(doc => total += doc.data().amount || 0);
        setStats(prev => ({ ...prev, totalWithdraw: total }));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, 'withdraw_requests')
    );

    // 4. Pending Withdraw Requests
    const unsubWithdrawPending = onSnapshot(
      query(collection(db, 'withdraw_requests'), where('status', '==', 'pending')), 
      (snap) => {
        setStats(prev => ({ ...prev, pendingWithdrawals: snap.size }));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, 'withdraw_requests')
    );

    // 5. Total Profit from Tournaments
    const unsubTournaments = onSnapshot(
      collection(db, 'tournaments'), 
      (snap) => {
        let total = 0;
        snap.forEach(doc => total += doc.data().profit || 0);
        setStats(prev => ({ ...prev, totalProfit: total }));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, 'tournaments')
    );

    return () => {
      unsubUsers();
      unsubRecharge();
      unsubWithdrawApproved();
      unsubWithdrawPending();
      unsubTournaments();
    };
  }, []);

  const statCards = [
    { 
      name: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      name: 'Total Recharge', 
      value: `$${(stats.totalRecharge || 0).toLocaleString()}`, 
      icon: ArrowDownCircle, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      name: 'Total Withdraw', 
      value: `$${(stats.totalWithdraw || 0).toLocaleString()}`, 
      icon: ArrowUpCircle, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10' 
    },
    { 
      name: 'Total Profit', 
      value: `$${(stats.totalProfit || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
    },
    { 
      name: 'Pending Withdrawals', 
      value: stats.pendingWithdrawals, 
      icon: Clock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    },
  ];

  if (!isAuthorized) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-500 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-zinc-400 mb-8">
          You do not have administrative privileges to access this panel.
        </p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-3xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-zinc-400 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            <p className="text-zinc-500 text-sm italic">Activity feed coming soon...</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-medium transition-colors">
              Create Tournament
            </button>
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-medium transition-colors">
              Approve Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
