import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const REQUEST_TIMEOUT_MS = 6500;

let cachedOnlineState = true;
let isListenerInitialized = false;
const networkSubscribers = new Set();

export function isNetStateConnected(netState) {
  if (!netState) return true;
  if (netState.isConnected === false) return false;
  if (netState.isInternetReachable === false) return false;
  return true;
}

function ensureNetworkMonitorInitialized() {
  if (isListenerInitialized) return;
  isListenerInitialized = true;

  NetInfo.fetch()
    .then((state) => {
      cachedOnlineState = isNetStateConnected(state);
    })
    .catch(() => {});

  NetInfo.addEventListener((state) => {
    const nextOnline = isNetStateConnected(state);
    if (nextOnline !== cachedOnlineState) {
      cachedOnlineState = nextOnline;
      networkSubscribers.forEach((listener) => {
        try {
          listener(cachedOnlineState);
        } catch {}
      });
    }
  });
}

export function getIsOnlineSync() {
  ensureNetworkMonitorInitialized();
  return cachedOnlineState;
}

export function subscribeNetworkStatus(listener) {
  ensureNetworkMonitorInitialized();
  networkSubscribers.add(listener);
  return () => {
    networkSubscribers.delete(listener);
  };
}

export async function checkIsOnline() {
  ensureNetworkMonitorInitialized();
  const netState = await NetInfo.fetch();
  cachedOnlineState = isNetStateConnected(netState);
  return cachedOnlineState;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => getIsOnlineSync());

  useEffect(() => {
    setIsOnline(getIsOnlineSync());
    return subscribeNetworkStatus((nextOnline) => {
      setIsOnline(nextOnline);
    });
  }, []);

  return {
    isOnline,
    isConnected: isOnline,
    isInternetReachable: isOnline,
  };
}

export async function ensureNetworkConnection() {
  const isOnline = await checkIsOnline();

  if (!isOnline) {
    throw new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
  }
}

export async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('O servidor demorou muito para responder (tempo limite esgotado).');
    }
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  } finally {
    clearTimeout(timeoutId);
  }
}
