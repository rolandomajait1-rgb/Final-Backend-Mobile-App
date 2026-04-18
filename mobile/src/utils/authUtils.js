import AsyncStorage from '@react-native-async-storage/async-storage';

export const ROLE_USER = 'user';
export const ROLE_ADMIN = 'admin';
export const ROLE_MODERATOR = 'moderator';

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current user from AsyncStorage
 */
export const getCurrentUserFromStorage = async () => {
  try {
    const userJson = await AsyncStorage.getItem('user_data');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

/**
 * Save user data to AsyncStorage
 */
export const saveUserToStorage = async (user) => {
  try {
    if (user) {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user_data');
    }
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

/**
 * Check if current user is admin
 */
export const isAdmin = async () => {
  try {
    const user = await getCurrentUserFromStorage();
    return user?.role === ROLE_ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if current user is moderator
 */
export const isModerator = async () => {
  try {
    const user = await getCurrentUserFromStorage();
    return user?.role === ROLE_MODERATOR;
  } catch (error) {
    console.error('Error checking moderator status:', error);
    return false;
  }
};

/**
 * Check if current user is admin or moderator
 */
export const isAdminOrModerator = async () => {
  try {
    const user = await getCurrentUserFromStorage();
    return user?.role === ROLE_ADMIN || user?.role === ROLE_MODERATOR;
  } catch (error) {
    console.error('Error checking admin/moderator status:', error);
    return false;
  }
};

/**
 * Clear user data from storage
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};
