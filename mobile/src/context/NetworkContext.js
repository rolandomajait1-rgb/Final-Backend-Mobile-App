import { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext();

// FIX: Add timeout wrapper for NetInfo.fetch
const netInfoWithTimeout = (timeoutMs = 3000) => {
  return Promise.race([
    NetInfo.fetch(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('NetInfo timeout')), timeoutMs)
    ),
  ]);
};

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [netInfoError, setNetInfoError] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    // Fetch initial state with timeout - don't block app startup
    const initNetInfo = async () => {
      try {
        const state = await netInfoWithTimeout(3000);
        setIsConnected(state.isConnected ?? false);
        setIsInternetReachable(state.isInternetReachable ?? true);
      } catch (err) {
        console.warn('[NetworkContext] NetInfo timeout/error:', err.message);
        setNetInfoError(true);
        // Default to assuming we have connection - let the app try
        setIsConnected(true);
        setIsInternetReachable(true);
      }
    };

    initNetInfo();

    return () => unsubscribe();
  }, []);

  const value = {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable !== false,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
