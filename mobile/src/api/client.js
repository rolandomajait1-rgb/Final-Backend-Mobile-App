import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

import { BASE_URL } from '../constants/config';
import { logError } from '../utils/logger';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s default — handles Render free-tier cold starts (can take 30-60s)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Extend timeout for slow/auth-sensitive endpoints
client.interceptors.request.use((config) => {
  const slowEndpoints = [
    '/forgot-password',
    '/register',
    '/login',
    '/user',
    '/me',
    '/profile',
    '/current-user',
  ];
  if (slowEndpoints.some(path => config.url?.includes(path))) {
    config.timeout = 60000; // 60s for auth + profile endpoints
  }
  return config;
});

// Request interceptor — attach token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT: If the body is FormData, remove the global Content-Type header.
    // The native networking layer will then auto-set:
    //   Content-Type: multipart/form-data; boundary=<generated>
    // Keeping the global "application/json" header strips the boundary and
    // causes ERR_NETWORK / body-parse failures on the backend.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register');

    // Handle 401 Unauthorized globally EXCEPT for auth routes which handle it locally
    if (error.response?.status === 401 && !isAuthRoute) {
      // Prevent infinite loop
      if (originalRequest._retry) {
        await AsyncStorage.removeItem('auth_token');
        DeviceEventEmitter.emit('LOGOUT');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/api/refresh`, {
            refresh_token: refreshToken,
          });

          const { token, refresh_token } = response.data;
          await AsyncStorage.multiSet([
            ['auth_token', token],
            ['refresh_token', refresh_token],
          ]);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
        DeviceEventEmitter.emit('LOGOUT');
        // Security #1 Fix: Use sanitized logging
        logError('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }

      // No refresh token, logout
      await AsyncStorage.removeItem('auth_token');
      DeviceEventEmitter.emit('LOGOUT');
    }

    return Promise.reject(error);
  }
);

export default client;