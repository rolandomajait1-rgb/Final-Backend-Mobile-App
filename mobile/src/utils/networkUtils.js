import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is connected to internet
 * @returns {Promise<boolean>}
 */
export const isConnected = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Called with boolean when network state changes
 * @returns {Function} unsubscribe function
 */
export const subscribeToNetworkState = (callback) => {
  return NetInfo.addEventListener(state => {
    const connected = state.isConnected && state.isInternetReachable !== false;
    callback(connected);
  });
};

/**
 * Get detailed network information
 * @returns {Promise<Object>}
 */
export const getNetworkInfo = async () => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type, // wifi, cellular, none, etc.
    details: state.details,
  };
};
