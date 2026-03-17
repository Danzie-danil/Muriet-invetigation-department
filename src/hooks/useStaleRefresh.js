import { useState, useEffect, useCallback, useRef } from 'react';
import { withTimeout } from '../lib/utils';

/**
 * Custom hook to implement a "Stale-While-Revalidate" fetching pattern.
 * This prevents the UI from "wiping" or flickering between loading states
 * when returning to a tab or performing background real-time updates.
 * 
 * @param {Function} fetchFn - Async function that returns the data from Supabase.
 * @param {Object} options - Configuration options.
 * @param {Array} options.deps - Dependency array for the fetch function (default: []).
 * @param {any} options.initialData - Starting data state (default: []).
 * @param {number} options.timeout - Query timeout in ms (default: 8000).
 * @param {number} options.retryInterval - Auto-retry delay in ms (default: 5000).
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true).
 */
export function useStaleRefresh(fetchFn, options = {}) {
  const { 
    deps = [], 
    initialData = [], 
    timeout = 8000, 
    retryInterval = 5000,
    autoFetch = true 
  } = options;

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const retryTimer = useRef(null);

  const performFetch = useCallback(async (isBackground = false) => {
    // CRITICAL: Only show the loading spinner if we have NO data yet.
    // This is the core fix for the "disappearing data" bug.
    const shouldShowSpinner = !isBackground && (Array.isArray(data) ? data.length === 0 : !data);

    if (shouldShowSpinner) setIsLoading(true);
    if (!isBackground) setError(null);

    // Clear any pending retry
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    try {
      const result = await withTimeout(fetchFn(), timeout);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      if (!isBackground) {
        setError(err.message || 'Connection failed. Retrying...');
        // Auto-retry
        retryTimer.current = setTimeout(() => performFetch(false), retryInterval);
      }
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [data, fetchFn, timeout, retryInterval, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoFetch) {
      performFetch(false);
    }
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [performFetch, autoFetch]);

  return { 
    data, 
    setData, 
    isLoading, 
    error, 
    refresh: () => performFetch(false),
    backgroundRefresh: () => performFetch(true)
  };
}
