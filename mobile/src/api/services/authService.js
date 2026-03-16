import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../client';
import ENDPOINTS from '../endpoints';

export const login = async (email, password) => {
  const response = await client.post(ENDPOINTS.LOGIN, { email, password });
  const { token } = response.data;
  if (token) {
    await AsyncStorage.setItem('auth_token', token);
  }
  return response.data;
};

export const logout = async () => {
  try {
    await client.post(ENDPOINTS.LOGOUT);
  } finally {
    await AsyncStorage.removeItem('auth_token');
  }
};

export const getCurrentUser = () =>
  client.get(ENDPOINTS.CURRENT_USER);
