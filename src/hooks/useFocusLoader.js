import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { toFriendlyMessage } from '../services/supabase';

export function useFocusLoader(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnce = useRef(false);

  const runLoader = useCallback(loader, dependencies);

  const load = useCallback(
    async (mode = 'focus') => {
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
