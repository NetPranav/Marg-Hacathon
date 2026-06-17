import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marg-hacathon.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop on refresh route
    if (originalRequest.url === '/auth/refresh/') {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refresh_token');
      
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        Cookies.set('access_token', access);
        
        // Update original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
