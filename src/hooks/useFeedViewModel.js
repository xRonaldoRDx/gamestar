import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FEED_PAGE_SIZE,
  FEED_TYPE,
  fetchFollowingFeed,
  fetchTrendingFeed,
  getCachedFeedEntries,
  saveCachedFeedEntries,
} from '../services/library';
import { checkIsOnline, useNetworkStatus } from '../services/network';
import { toFriendlyMessage } from '../services/supabase';

export function useFeedViewModel({ userId, currentUserProfile }) {
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState(FEED_TYPE.FOLLOWING);
  const [entriesByTab, setEntriesByTab] = useState({
    [FEED_TYPE.FOLLOWING]: null,
    [FEED_TYPE.TRENDING]: null,
  });
  const [hasMoreByTab, setHasMoreByTab] = useState({
    [FEED_TYPE.FOLLOWING]: false,
    [FEED_TYPE.TRENDING]: false,
  });
  const [pageByTab, setPageByTab] = useState({
    [FEED_TYPE.FOLLOWING]: 0,
    [FEED_TYPE.TRENDING]: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [error, setError] = useState('');

  const entriesByTabRef = useRef(entriesByTab);
  const hasMoreByTabRef = useRef(hasMoreByTab);
  const pageByTabRef = useRef(pageByTab);
  const requestCounterRef = useRef(0);
  const isFetchingNextPageRef = useRef(false);

  useEffect(() => {
    entriesByTabRef.current = entriesByTab;
  }, [entriesByTab]);

  useEffect(() => {
    hasMoreByTabRef.current = hasMoreByTab;
  }, [hasMoreByTab]);

  useEffect(() => {
    pageByTabRef.current = pageByTab;
  }, [pageByTab]);

  const executeFeedQuery = useCallback(
    async (tab, page) => {
      if (tab === FEED_TYPE.TRENDING) {
        return fetchTrendingFeed({ userId, page, pageSize: FEED_PAGE_SIZE });
      }
      return fetchFollowingFeed(userId, { page, pageSize: FEED_PAGE_SIZE });
    },
    [userId]
  );

  const loadFirstPage = useCallback(
    async (mode = 'focus', targetTab = activeTab) => {
      if (!userId && targetTab === FEED_TYPE.FOLLOWING) return;

      const currentRequestId = ++requestCounterRef.current;
      isFetchingNextPageRef.current = false;
      setIsFetchingNextPage(false);

      const existingTabEntries = entriesByTabRef.current[targetTab];

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else if (!existingTabEntries) {
        setIsLoading(true);
      }
      setError('');

      const online = await checkIsOnline();

      if (!online) {
        const cachedEntries = getCachedFeedEntries(targetTab, userId);
        if (currentRequestId !== requestCounterRef.current) return;

        if (cachedEntries) {
          setEntriesByTab((prev) => ({ ...prev, [targetTab]: cachedEntries }));
          setHasMoreByTab((prev) => ({ ...prev, [targetTab]: false }));
          setPageByTab((prev) => ({ ...prev, [targetTab]: 0 }));
          setIsOfflineFallback(true);
        } else if (!existingTabEntries) {
          setError('Sem conexão com a internet e nenhum dado salvo localmente.');
        }

        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        const result = await executeFeedQuery(targetTab, 0);
        if (currentRequestId !== requestCounterRef.current) return;

        const nextEntries = Array.isArray(result.entries) ? result.entries : [];
        setEntriesByTab((prev) => ({ ...prev, [targetTab]: nextEntries }));
        setHasMoreByTab((prev) => ({ ...prev, [targetTab]: Boolean(result.hasMore) }));
        setPageByTab((prev) => ({ ...prev, [targetTab]: 0 }));
        setIsOfflineFallback(false);
      } catch (err) {
        if (currentRequestId !== requestCounterRef.current) return;

        const cachedEntries = getCachedFeedEntries(targetTab, userId);
        if (cachedEntries) {
          setEntriesByTab((prev) => ({ ...prev, [targetTab]: cachedEntries }));
          setHasMoreByTab((prev) => ({ ...prev, [targetTab]: false }));
          setPageByTab((prev) => ({ ...prev, [targetTab]: 0 }));
          setIsOfflineFallback(true);
          setError('');
        } else {
          setError(toFriendlyMessage(err, 'Não foi possível carregar o feed.'));
        }
      } finally {
        if (currentRequestId === requestCounterRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeTab, executeFeedQuery, userId]
  );

  const loadNextPage = useCallback(async () => {
    if (isFetchingNextPage || isFetchingNextPageRef.current) return;

    const currentEntries = entriesByTabRef.current[activeTab];
    const hasMore = hasMoreByTabRef.current[activeTab];
    const currentPage = pageByTabRef.current[activeTab] ?? 0;

    if (
      !Array.isArray(currentEntries) ||
      !hasMore ||
      isLoading ||
      isRefreshing ||
      isOfflineFallback
    ) {
      return;
    }

    isFetchingNextPageRef.current = true;
    setIsFetchingNextPage(true);

    const online = await checkIsOnline();
    if (!online) {
      isFetchingNextPageRef.current = false;
      setIsFetchingNextPage(false);
      setIsOfflineFallback(true);
      return;
    }

    const nextPage = currentPage + 1;
    const targetTab = activeTab;

    try {
      const result = await executeFeedQuery(targetTab, nextPage);
      const newReviews = Array.isArray(result.entries) ? result.entries : [];

      const previousList = Array.isArray(entriesByTabRef.current[targetTab])
        ? entriesByTabRef.current[targetTab]
        : [];
      const appendedList = [...previousList, ...newReviews];

      setEntriesByTab((prev) => ({
        ...prev,
        [targetTab]: appendedList,
      }));
      setHasMoreByTab((prev) => ({ ...prev, [targetTab]: Boolean(result.hasMore) }));
      setPageByTab((prev) => ({ ...prev, [targetTab]: nextPage }));

      setTimeout(() => {
        saveCachedFeedEntries(targetTab, userId, appendedList);
      }, 0);
    } catch {
      setHasMoreByTab((prev) => ({ ...prev, [targetTab]: false }));
    } finally {
      isFetchingNextPageRef.current = false;
      setIsFetchingNextPage(false);
    }
  }, [
    activeTab,
    executeFeedQuery,
    isFetchingNextPage,
    isLoading,
    isOfflineFallback,
    isRefreshing,
    userId,
  ]);

  const handleSelectTab = useCallback(
    (nextTab) => {
      if (nextTab === activeTab) return;
      setActiveTab(nextTab);
      setError('');
    },
    [activeTab]
  );

  useFocusEffect(
    useCallback(() => {
      if (!entriesByTabRef.current[activeTab]) {
        loadFirstPage('focus', activeTab);
      }
    }, [activeTab, loadFirstPage])
  );

  useEffect(() => {
    if (isOnline && isOfflineFallback) {
      loadFirstPage('refresh', activeTab);
    }
  }, [activeTab, isOfflineFallback, isOnline, loadFirstPage]);

  const rawActiveEntries = entriesByTab[activeTab];

  const entries = useMemo(() => {
    if (!Array.isArray(rawActiveEntries)) return null;
    if (!currentUserProfile) return rawActiveEntries;

    return rawActiveEntries.map((entry) => {
      if (entry.user_id !== userId) {
        return entry;
      }

      return {
        ...entry,
        profile: {
          ...entry.profile,
          ...currentUserProfile,
        },
      };
    });
  }, [currentUserProfile, rawActiveEntries, userId]);

  const refresh = useCallback(() => {
    loadFirstPage('refresh', activeTab);
  }, [activeTab, loadFirstPage]);

  return {
    activeTab,
    entries,
    isLoading: isLoading && !entries,
    isRefreshing,
    isLoadingMore: isFetchingNextPage,
    isFetchingNextPage,
    hasMore: Boolean(hasMoreByTab[activeTab]),
    isOfflineFallback,
    error,
    handleSelectTab,
    refresh,
    loadNextPage,
  };
}
