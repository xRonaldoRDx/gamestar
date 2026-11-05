import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { toFriendlyMessage } from '../services/supabase';

/**
 * Runs `loader` every time the screen gains focus, so data edited on another
 * screen is fresh when the user comes back. Exposes loading, error and
 * pull-to-refresh states.
 */
export function useFocusLoader(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnce = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runLoader = useCallback(loader, dependencies);

  const load = useCallback(
    async (mode = 'focus') => {
      // Refocusing keeps the current content on screen instead of flashing a spinner
      if (mode === 'refresh') setIsRefreshing(true);
      else if (!hasLoadedOnce.current) setIsLoading(true);
      setError('');

      try {
        setData(await runLoader());
        hasLoadedOnce.current = true;
      } catch (err) {
        setError(toFriendlyMessage(err, err?.message || 'Não foi possível carregar.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [runLoader]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return {
    data,
    setData,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load('refresh'),
  };
}
