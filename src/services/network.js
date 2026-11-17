import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

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

  return { isOnline };
}

export async function ensureNetworkConnection() {
  const isOnline = await checkIsOnline();

  if (!isOnline) {
    throw new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
  }
}
