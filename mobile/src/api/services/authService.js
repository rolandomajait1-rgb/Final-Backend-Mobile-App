import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../client';
import ENDPOINTS from '../endpoints';
import { normalizeResponse, extractData } from '../responseNormalizer';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Normalized response with token and user data
 */
export const login = async (email, password) => {
  const response = await client.post(ENDPOINTS.LOGIN, { email, password });
  const normalized = normalizeResponse(response);
  const data = extractData(normalized);

  if (data.token) {
    await AsyncStorage.setItem('auth_token', data.token);
  }
  if (data.user) {
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
  }

  return normalized;
};

/**
 * Logout current user
 * @returns {Promise<Object>} Normalized response
 */
export const logout = async () => {
  try {
    const response = await client.post(ENDPOINTS.LOGOUT);
    return normalizeResponse(response);
  } finally {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<Object>} Normalized response with user data
 */
export const getCurrentUser = async () => {
  const response = await client.get(ENDPOINTS.CURRENT_USER);
  return normalizeResponse(response);
};
