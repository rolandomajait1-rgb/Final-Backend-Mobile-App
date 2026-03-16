import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook to safely handle async operations in components
 * Prevents setting state on unmounted components
 */
export const useSafeAsync = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((callback) => {
    if (isMountedRef.current) {
      callback();
    }
  }, []);

  return { isMounted: () => isMountedRef.current, safeSetState };
};

/**
 * Custom hook for safe async fetch operations
 * @param {Function} asyncFunction - Async function to execute
 * @param {Array} dependencies - useEffect dependencies
 * @returns {Object} - { data, loading, error }
 */
export const useSafeFetch = (asyncFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { safeSetState } = useSafeAsync();

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        safeSetState(() => {
          setLoading(true);
          setError(null);
        });

        const result = await asyncFunction();

        if (!isCancelled) {
          safeSetState(() => {
            setData(result);
            setLoading(false);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          safeSetState(() => {
            setError(err);
            setLoading(false);
          });
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
};
