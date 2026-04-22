import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../client';
import ENDPOINTS from '../endpoints';

export const login = async (email, password) => {
  const response = await client.post(ENDPOINTS.LOGIN, { email, password });
  const { token, user } = response.data;
  if (token) {
    await AsyncStorage.setItem('auth_token', token);
  }
  if (user) {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  }
  return response.data;
};

// Bug #13 Fix: Handle logout errors properly and clear storage regardless
export const logout = async () => {
  try {
    await client.post(ENDPOINTS.LOGOUT);
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue to clear local storage even if API fails
  } finally {
    await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_email', 'user_name', 'user_role', 'remember_me']);
  }
};

export const getCurrentUser = () =>
  client.get(ENDPOINTS.CURRENT_USER);
