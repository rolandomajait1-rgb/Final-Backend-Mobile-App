import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

import { BASE_URL } from '../constants/config';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Extend timeout for slow endpoints (Render cold start)
client.interceptors.request.use((config) => {
  if (config.url?.includes('/forgot-password') || config.url?.includes('/register')) {
    config.timeout = 180000;
  }
  // Extra time for cold starts on all endpoints
  if (!config.timeout || config.timeout < 60000) {
    config.timeout = 60000;
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

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
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