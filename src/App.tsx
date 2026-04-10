import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, adminEmails } from './firebase';
import { UserProfile } from './types';
import { 
  LayoutDashboard, 
  Trophy, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users as UsersIcon, 
  FileText, 
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Pages
import Dashboard from './pages/Dashboard';
import Tournament from "./pages/Tournament";
import RechargeRequest from "./pages/RechargeRequest";
import WithdrawRequest from './pages/WithdrawRequest';
import Users from './pages/Users';
import Results from './pages/Results';
import Login from './pages/Login';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const email = firebaseUser.email;
      const isAuthorized = email ? adminEmails.includes(email) : false;

      if (isAuthorized) {
        setIsAdmin(true);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Admin',
          role: 'admin',
          walletBalance: 0,
          createdAt: new Date().toISOString()
        });
      } else {
        await signOut(auth);
        setUser(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      {isAdmin ? (
        <AdminLayout user={user!}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 🔥 IMPORTANT FIX */}
            <Route path="/tournaments" element={<Tournament />} />

            <Route path="/recharge" element={<RechargeRequest />} />
            <Route path="/withdraw" element={<WithdrawRequest />} />
            <Route path="/users" element={<Users />} />
            <Route path="/results" element={<Results />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AdminLayout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

// 🔥 ADMIN LAYOUT
function AdminLayout({ children, user }: { children: React.ReactNode, user: UserProfile }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    { name: 'Recharge', path: '/recharge', icon: ArrowDownCircle },
    { name: 'Withdraw', path: '/withdraw', icon: ArrowUpCircle },
    { name: 'Results', path: '/results', icon: FileText },
    { name: 'Users', path: '/users', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg mb-2",
                isActive ? "bg-emerald-500 text-black" : "hover:bg-zinc-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}

        <button
          onClick={() => signOut(auth)}
          className="mt-6 flex items-center gap-2 text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
