import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { Trophy, Users, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecharge: 0,
    totalWithdraw: 0,
    totalProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubRecharge = onSnapshot(query(collection(db, 'recharge_requests'), where('status', '==', 'approved')), (snap) => {
      let total = 0;
      snap.forEach(doc => total += doc.data().amount || 0);
      setStats(prev => ({ ...prev, totalRecharge: total }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recharge'));

    const unsubWithdraw = onSnapshot(query(collection(db, 'withdraw_requests'), where('status', '==', 'approved')), (snap) => {
      let total = 0;
      snap.forEach(doc => total += doc.data().amount || 0);
      setStats(prev => ({ ...prev, totalWithdraw: total }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'withdraw'));

    const unsubTournaments = onSnapshot(collection(db, 'tournaments'), (snap) => {
      let total = 0;
      snap.forEach(doc => total += doc.data().profit || 0);
      setStats(prev => ({ ...prev, totalProfit: total }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tournaments'));

    return () => {
      unsubUsers();
      unsubRecharge();
      unsubWithdraw();
      unsubTournaments();
    };
  }, []);

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Recharge', value: `$${(stats.totalRecharge || 0).toLocaleString()}`, icon: ArrowDownCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Total Withdraw', value: `$${(stats.totalWithdraw || 0).toLocaleString()}`, icon: ArrowUpCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Total Profit', value: `$${(stats.totalProfit || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-3xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-zinc-400 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
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

// Helper for class names (re-defined here or imported if exported from App)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
