import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, adminEmails } from '../firebase';
import { Trophy, Mail, Lock, ArrowRight, Github, Chrome, AlertCircle, CheckCircle2 } from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const checkAdminAccess = (email: string | null) => {
    if (!email || !adminEmails.includes(email)) {
      throw new Error("Access Denied: You do not have administrative privileges.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      checkAdminAccess(result.user.email);
    } catch (error: any) {
      await auth.signOut();
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setLoading(true);
      setMessage(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      checkAdminAccess(result.user.email);
    } catch (error: any) {
      await auth.signOut();
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage({ type: 'success', text: "Account created successfully!" });
      setIsSignup(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: "Please enter your email address first" });
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage({ type: 'success', text: "Password reset link sent to your email" });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Trophy className="text-zinc-950 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isSignup ? "Create Account" : "Admin Portal"}
          </h1>
          <p className="text-zinc-400">
            {isSignup ? "Join the tournament management platform" : "Sign in to manage your platform"}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          {message && (
            <div className={cn(
              "mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2",
              message.type === 'error' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            )}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-4 text-zinc-500 font-semibold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-zinc-950 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5" />
            Google Account
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage(null);
              }}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {isSignup ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">
            Restricted Access
          </p>
          <p className="text-sm text-zinc-400">
            Only authorized administrator emails can access the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
