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
  LogOut,
  ShieldAlert,
  Menu,
  X
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
        setIsAdmin(false);
        setUser(null);
        await signOut(auth);
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

  if (isAdmin) {
    return (
      <Router>
        <AdminLayout user={user!}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ✅ FIX HERE */}
            <Route path="/dashboard/tournaments" element={<Tournament />} />
            <Route path="/dashboard/recharge" element={<RechargeRequest />} />
            <Route path="/dashboard/withdraw" element={<WithdrawRequest />} />
            <Route path="/dashboard/users" element={<Users />} />
            <Route path="/dashboard/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AdminLayout>
      </Router>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return <NotAuthorized />;
}

function AdminLayout({ children, user }: { children: React.ReactNode, user: UserProfile }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments', path: '/dashboard/tournaments', icon: Trophy },
    { name: 'Recharge Requests', path: '/dashboard/recharge', icon: ArrowDownCircle },
    { name: 'Withdraw Requests', path: '/dashboard/withdraw', icon: ArrowUpCircle },
    { name: 'Results', path: '/dashboard/results', icon: FileText },
    { name: 'Users', path: '/dashboard/users', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transition-transform",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6">
          <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded">
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
        </div>
      </aside>

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Access Denied
    </div>
  );
}
