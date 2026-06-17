'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  organization: number;
  organization_name: string | null;
  kyc_status: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (access, refresh, user) => {
    // Set cookies for middleware and axios
    Cookies.set('access_token', access, { expires: 1 }); // 1 day
    Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
    
    // Also save user metadata to localStorage so it survives refresh
    localStorage.setItem('user_data', JSON.stringify(user));

    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.removeItem('user_data');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  checkAuth: () => {
    const token = Cookies.get('access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Interceptor will try to refresh when an API call happens
        // but for initial load, we assume unauthorized until refreshed
      }
      
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        set({ user: JSON.parse(userDataStr), isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
