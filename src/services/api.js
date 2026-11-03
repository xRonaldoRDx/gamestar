import NetInfo from '@react-native-community/netinfo';
import { mapCatalogGame } from './mockGames';

const BASE_URL = 'https://api.rawg.io/api';
const REQUEST_TIMEOUT_MS = 6500;

function getApiKey() {
  const apiKey = process.env.EXPO_PUBLIC_RAWG_API_KEY?.trim();

  if (!apiKey) {
    console.error('[API Service] Missing EXPO_PUBLIC_RAWG_API_KEY environment variable.');
    throw new Error('Não foi possível conectar ao servidor de jogos no momento.');
  }

  return apiKey;
}

export async function ensureNetworkConnection() {
  const netState = await NetInfo.fetch();
  const isOffline =
    netState.isConnected === false || netState.isInternetReachable === false;

  if (isOffline) {
    throw new Error(
      'Sem conexão com a internet. Não foi possível conectar ao servidor de jogos.'
    );
  }
}

async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'O servidor de jogos demorou muito para responder (tempo limite esgotado).'
      );
    }
    throw new Error(
      'Não foi possível conectar ao servidor de jogos. Verifique sua conexão e tente novamente.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGamesFromApi(searchQuery) {
  const trimmedQuery = (searchQuery || '').trim();
  if (!trimmedQuery) {
    return [];
  }

  await ensureNetworkConnection();

  const apiKey = getApiKey();
  const url = `${BASE_URL}/games?search=${encodeURIComponent(
    trimmedQuery
  )}&page_size=15&key=${encodeURIComponent(apiKey)}`;

  const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    if (response.status === 401) {
      console.error('[API Service] Unauthorized API key.');
      throw new Error('Não foi possível conectar ao servidor de jogos (serviço indisponível).');
    }
    throw new Error('Não foi possível conectar ao servidor de jogos no momento.');
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map(mapCatalogGame);
}

export async function fetchGameDetailsFromApi(rawgId) {
  if (!rawgId) {
    return null;
  }

  await ensureNetworkConnection();

  const apiKey = getApiKey();
  const url = `${BASE_URL}/games/${encodeURIComponent(
    String(rawgId)
  )}?key=${encodeURIComponent(apiKey)}`;

  const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error('Não foi possível carregar os detalhes deste jogo no momento.');
  }

  const data = await response.json();

  return {
    rawg_id: data.id,
    title: data.name,
    background_image: data.background_image || null,
    released: data.released || null,
    metacritic: data.metacritic ?? null,
    developers: Array.isArray(data.developers)
      ? data.developers.map((developer) => developer.name).join(', ')
      : '',
  };
}
