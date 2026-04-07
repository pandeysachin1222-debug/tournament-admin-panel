import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, adminEmails } from '../firebase';
import { Trophy } from 'lucide-react';

export default function Login() {

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      // 🔐 Admin Check
      if (!adminEmails.includes(userEmail!)) {
        alert("Access Denied: Not an Admin");

        // ❌ Logout immediately
        await signOut(auth);
        return;
      }

      // ✅ Success
      alert("Welcome Admin 👑");

      // 👉 Dashboard redirect
      window.location.href = "/dashboard";

    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Trophy className="text-zinc-950 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Portal</h1>
          <p className="text-zinc-400">Sign in to manage your tournament platform</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-zinc-950 rounded-2xl font-bold hover:bg-zinc-200 transition-all duration-200"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Restricted Access
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              Only authorized administrator emails can access this dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
