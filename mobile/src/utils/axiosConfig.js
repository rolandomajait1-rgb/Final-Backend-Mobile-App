import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api`
  : 'http://localhost:8000/api'; // ✅ Use local backend for testing

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
  async (config) => {
    // Skip auth for public endpoints using custom config property
    if (config.skipAuth === true) {
      console.log('Skipping auth for:', config.url);
      return config;
    }
    
    try {
      const token = await AsyncStorage.getItem('auth_token') || await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Adding auth token for:', config.url);
      } else {
        console.log('No auth token found for:', config.url);
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default instance;
