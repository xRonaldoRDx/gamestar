import NetInfo from '@react-native-community/netinfo';

const REQUEST_TIMEOUT_MS = 6500;

export async function ensureNetworkConnection() {
  const netState = await NetInfo.fetch();
  const isOffline =
    netState.isConnected === false || netState.isInternetReachable === false;

  if (isOffline) {
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
