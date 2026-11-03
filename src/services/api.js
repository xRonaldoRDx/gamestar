import NetInfo from '@react-native-community/netinfo';
import { formatarJogoCatalogo } from './mockGames';

const BASE_URL = 'https://api.rawg.io/api';
const REQUEST_TIMEOUT_MS = 6500; // Timeout resiliente entre 5 e 8 segundos

/**
 * Consome silenciosamente a chave configurada no ambiente (.env).
 * Nunca expõe detalhes de configuração para o usuário final.
 */
function obterChaveApi() {
  const apiKey = process.env.EXPO_PUBLIC_RAWG_API_KEY?.trim();

  if (!apiKey) {
    console.error('[API Service] Chave de API ausente na variável EXPO_PUBLIC_RAWG_API_KEY.');
    throw new Error('Não foi possível conectar ao servidor de jogos no momento.');
  }

  return apiKey;
}

/**
 * Verifica previamente se há conectividade ativa antes de disparar requisições HTTP.
 */
export async function verificarConexaoRede() {
  const netState = await NetInfo.fetch();
  const semConexao =
    netState.isConnected === false || netState.isInternetReachable === false;

  if (semConexao) {
    throw new Error(
      'Sem conexão com a internet. Não foi possível conectar ao servidor de jogos.'
    );
  }
}

/**
 * Executa um fetch nativo protegido por AbortController com timeout configurável.
 */
async function fetchComTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
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

/**
 * Busca jogos no catálogo remoto pelo nome usando NetInfo + AbortController.
 * Em caso de falha, lança o erro (throw) para a camada ViewModel.
 */
export async function buscarJogosNaRawg(termoBusca) {
  const queryLimpa = (termoBusca || '').trim();
  if (!queryLimpa) {
    return [];
  }

  await verificarConexaoRede();

  const apiKey = obterChaveApi();
  const url = `${BASE_URL}/games?search=${encodeURIComponent(
    queryLimpa
  )}&page_size=15&key=${encodeURIComponent(apiKey)}`;

  const resposta = await fetchComTimeout(url, REQUEST_TIMEOUT_MS);

  if (!resposta.ok) {
    if (resposta.status === 401) {
      console.error('[API Service] Chave não autorizada pelo provedor.');
      throw new Error('Não foi possível conectar ao servidor de jogos (serviço indisponível).');
    }
    throw new Error('Não foi possível conectar ao servidor de jogos no momento.');
  }

  const dados = await resposta.json();

  if (!dados || !Array.isArray(dados.results)) {
    return [];
  }

  return dados.results.map(formatarJogoCatalogo);
}

/**
 * Busca detalhes e URL da capa oficial de um jogo pelo ID no catálogo.
 */
export async function buscarDetalhesJogoNaRawg(rawgId) {
  if (!rawgId) {
    return null;
  }

  await verificarConexaoRede();

  const apiKey = obterChaveApi();
  const url = `${BASE_URL}/games/${encodeURIComponent(
    String(rawgId)
  )}?key=${encodeURIComponent(apiKey)}`;

  const resposta = await fetchComTimeout(url, REQUEST_TIMEOUT_MS);

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar os detalhes deste jogo no momento.');
  }

  const dados = await resposta.json();

  return {
    rawg_id: dados.id,
    title: dados.name,
    background_image: dados.background_image || null,
    released: dados.released || null,
    metacritic: dados.metacritic ?? null,
    developers: Array.isArray(dados.developers)
      ? dados.developers.map((d) => d.name).join(', ')
      : '',
  };
}
