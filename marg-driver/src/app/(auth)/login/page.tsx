'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use standard JWT token pair obtain view
      const response = await api.post('/auth/login/', { email, password });
      
      const { access, refresh, user } = response.data;
      
      // Update global store
      login(access, refresh, user);
      
      // Redirect based on role
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'EMPLOYEE') {
        router.push('/ops/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-orange/5 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-sm z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-surface border border-brand-orange/20 rounded-[1.5rem] flex items-center justify-center shadow-soft">
            <Truck className="w-8 h-8 text-brand-orange" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-brand-text mb-2 tracking-tight">Marg OS</h1>
          <p className="text-brand-muted">Enterprise Logistics Platform</p>
        </div>

        <div className="bg-brand-surface rounded-[2rem] p-6 shadow-soft border border-brand-muted/10">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 px-4 py-3 rounded-[1rem] text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Email / Username</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3.5 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-all"
                  placeholder="admin@bluedart.in"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3.5 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C15B2B] text-white font-medium py-3.5 rounded-[1.2rem] mt-2 flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(193,91,43,0.25)] active:scale-[0.98]"
            >
              <span>{isLoading ? 'Authenticating...' : 'Secure Login'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center flex flex-col gap-3">
          <button 
            onClick={() => router.push('/register')}
            className="text-brand-text font-semibold text-sm hover:text-brand-orange transition-colors"
          >
            Create Account
          </button>
          <p className="text-xs text-brand-muted">Protected by Enterprise TLS</p>
        </div>
      </div>
    </div>
  );
}
