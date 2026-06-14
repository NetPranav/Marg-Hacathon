'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, login } = useAuthStore();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/change-password/', { new_password: password });
      
      // Update local user state
      if (user) {
        const updatedUser = { ...user, requires_password_change: false };
        // We'd ideally re-fetch token, but we can just update state and rely on next token refresh,
        // or just force a login redirect.
        // Let's force a redirect based on role.
        if (updatedUser.role === 'DRIVER') router.push('/');
        else if (updatedUser.role === 'EMPLOYEE') router.push('/ops/dashboard');
        else router.push('/admin/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-6 relative overflow-hidden pt-12 pb-12">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-orange/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-sm z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand-surface border border-brand-orange/20 rounded-[1.5rem] flex items-center justify-center shadow-soft">
            <ShieldCheck className="w-8 h-8 text-brand-orange" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-brand-text mb-2 tracking-tight">Secure Account</h1>
          <p className="text-brand-muted">Please set a new password to continue</p>
        </div>

        <div className="bg-brand-surface rounded-[2rem] p-6 shadow-soft border border-brand-muted/10">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 px-4 py-3 rounded-[1rem] text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">New Password</label>
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

            <div className="space-y-1.5">
              <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3.5 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C15B2B] text-white font-medium py-3.5 rounded-[1.2rem] mt-4 flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(193,91,43,0.25)] active:scale-[0.98]"
            >
              <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
