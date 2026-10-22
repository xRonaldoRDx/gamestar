const BASE_URL = 'https://api.rawg.io/api';

let runtimeApiKey = process.env.EXPO_PUBLIC_RAWG_API_KEY || '';

/**
 * Permite definir ou atualizar a chave da API em tempo de execução
 * caso o usuário não tenha configurado o arquivo .env.
 */
export function setRawgApiKey(key) {
  runtimeApiKey = (key || '').trim();
}

export function getRawgApiKey() {
  return runtimeApiKey;
}

/**
 * Busca jogos na RAWG API pelo nome (retorna apenas metadados textuais leves).
 * @param {string} query Termo de busca
 * @returns {Promise<Array>} Lista de jogos formatada
 */
export async function searchGames(query) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) {
    return [];
  }

  const apiKey = getRawgApiKey();
  if (!apiKey) {
    throw new Error(
      'Chave da RAWG API não configurada. Informe sua API Key no campo acima ou no arquivo .env (EXPO_PUBLIC_RAWG_API_KEY).'
    );
  }

  const url = `${BASE_URL}/games?search=${encodeURIComponent(
    cleanQuery
  )}&page_size=15&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Chave da RAWG API inválida ou não autorizada (Erro 401).');
    }
    throw new Error(`Falha ao buscar jogos na RAWG API (Status ${response.status}).`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.results)) {
    return [];
  }

  // Mapeia estritamente dados textuais para manter a performance na listagem
  return data.results.map((game) => ({
    rawg_id: game.id,
    title: game.name,
    released: game.released ? game.released.slice(0, 4) : 'N/A',
    metacritic: game.metacritic ?? null,
    genres: Array.isArray(game.genres)
      ? game.genres.map((g) => g.name).join(', ')
      : '',
  }));
}

/**
 * Busca detalhes e URL da capa de um jogo específico pelo ID da RAWG (usado sob demanda na Fase 5).
 * @param {number} rawgId ID do jogo na RAWG
 */
export async function fetchGameCoverAndDetails(rawgId) {
  if (!rawgId) {
    return null;
  }

  const apiKey = getRawgApiKey();
  if (!apiKey) {
    throw new Error('Chave da RAWG API ausente para buscar a capa do jogo.');
  }

  const url = `${BASE_URL}/games/${rawgId}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Não foi possível carregar os detalhes na RAWG (Status ${response.status}).`);
  }

  const data = await response.json();

  return {
    rawg_id: data.id,
    title: data.name,
    background_image: data.background_image || null,
    released: data.released || null,
    metacritic: data.metacritic ?? null,
    developers: Array.isArray(data.developers)
      ? data.developers.map((d) => d.name).join(', ')
      : '',
  };
}
