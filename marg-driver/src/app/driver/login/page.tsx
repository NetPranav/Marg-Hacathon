'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function DriverLoginPage() {
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
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user } = response.data;
      
      login(access, refresh, user);
      // Middleware will handle redirection based on token role, but we can proactively route
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Truck className="w-10 h-10 text-brand-orange -rotate-3" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Driver Portal</h1>
          <p className="text-white/50 font-medium">Log in to view your shipments and routes</p>
        </div>

        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 text-white px-5 py-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder:text-white/20 border border-transparent focus:border-brand-orange/30"
                placeholder="driver@nexuslogistics.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 text-white px-5 py-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder:text-white/20 border border-transparent focus:border-brand-orange/30"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#C15B2B] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(255,123,71,0.25)] hover:shadow-[0_8px_40px_rgba(255,123,71,0.4)] mt-8"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Enter Portal <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-white/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Secure Enterprise Login
          </div>
        </div>
      </div>
    </div>
  );
}
