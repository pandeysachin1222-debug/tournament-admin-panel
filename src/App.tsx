import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, adminEmails } from './firebase';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './utils/errorHandling';
import { 
  LayoutDashboard, 
  Trophy, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users as UsersIcon, 
  FileText, 
  LogOut,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-400 font-medium animate-pulse text-sm tracking-wider uppercase">Loading...</p>
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
            <Route path="/dashboard/tournaments" element={<Tournaments />} />
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

function PublicHome({ user }: { user: UserProfile | null }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
        <Trophy className="text-zinc-950 w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Tournament Platform</h1>
      <p className="text-zinc-400 max-w-md mb-10 leading-relaxed">
        Welcome to the gaming arena. This is the public landing page. 
        Administrative features are restricted to authorized personnel.
      </p>
      
      {user ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
              {user.displayName[0]}
            </div>
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      ) : (
        <Link 
          to="/login"
          className="px-8 py-3 bg-emerald-500 text-zinc-950 rounded-xl font-bold hover:bg-emerald-400 transition-all"
        >
          Go to Login
        </Link>
      )}
    </div>
  );
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
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full lg:hidden"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Trophy className="text-zinc-950 w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-emerald-500 text-zinc-950 font-medium" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-zinc-950" : "group-hover:text-emerald-500")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-3 mb-4 px-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                {user.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 lg:hidden">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <h1 className="font-bold">Admin Panel</h1>
          <div className="w-6" />
        </header>
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-500 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-zinc-400 mb-8">
          You do not have administrative privileges to access this panel. 
          Please contact the system administrator if you believe this is an error.
        </p>
        <button 
          onClick={() => signOut(auth)}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
