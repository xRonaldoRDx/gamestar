import { useEffect, useState } from 'react';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

const REQUEST_TIMEOUT_MS = 6500;

export function isNetStateConnected(netState) {
  if (!netState) return true;
  if (netState.isConnected === false) return false;
  if (netState.isInternetReachable === false) return false;
  return true;
}

export async function checkIsOnline() {
  const netState = await NetInfo.fetch();
  return isNetStateConnected(netState);
}

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  const [isOnline, setIsOnline] = useState(() => isNetStateConnected(netInfo));

  useEffect(() => {
    setIsOnline(isNetStateConnected(netInfo));
  }, [netInfo.isConnected, netInfo.isInternetReachable]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(isNetStateConnected(state));
    });
    return () => unsubscribe();
  }, []);

  return {
    isOnline,
    isConnected: netInfo.isConnected,
    isInternetReachable: netInfo.isInternetReachable,
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
