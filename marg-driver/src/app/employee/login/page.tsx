'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Middleware will handle redirection based on token role
      router.push('/ops/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-black/[0.03]">
            <Briefcase className="w-10 h-10 text-brand-text" />
          </div>
          <h1 className="text-3xl font-black text-brand-text tracking-tight mb-2">Employee Portal</h1>
          <p className="text-brand-muted font-medium">Log in to manage operations and verification</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-black/[0.03] shadow-soft">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-black/5 text-brand-text px-5 py-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder:text-black/30 border border-transparent focus:border-brand-orange/30"
                placeholder="employee@nexuslogistics.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-black/5 text-brand-text px-5 py-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder:text-black/30 border border-transparent focus:border-brand-orange/30"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-text text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-brand-muted text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Nexus Internal Network
          </div>
        </div>
      </div>
    </div>
  );
}
