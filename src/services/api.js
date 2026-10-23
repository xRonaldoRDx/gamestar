const BASE_URL = 'https://api.rawg.io/api';

function obterChaveApi() {
  const apiKey = process.env.EXPO_PUBLIC_RAWG_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'Chave da RAWG API não encontrada. Configure EXPO_PUBLIC_RAWG_API_KEY no arquivo .env e reinicie o Expo.'
    );
  }

  return apiKey;
}

/**
 * Busca jogos na RAWG API pelo nome retornando apenas metadados textuais leves.
 */
export async function buscarJogosNaRawg(termoBusca) {
  const queryLimpa = (termoBusca || '').trim();
  if (!queryLimpa) {
    return [];
  }

  const apiKey = obterChaveApi();
  const url = `${BASE_URL}/games?search=${encodeURIComponent(
    queryLimpa
  )}&page_size=15&key=${encodeURIComponent(apiKey)}`;

  // 1. Faz a chamada de rede via Fetch API nativa
  const resposta = await fetch(url);

  // 2. Verifica se houve erro HTTP (401, 404, 500)
  if (!resposta.ok) {
    if (resposta.status === 401) {
      throw new Error('Chave da RAWG API inválida ou não autorizada (Erro 401).');
    }
    throw new Error(`Falha ao buscar jogos na RAWG API (Status ${resposta.status}).`);
  }

  // 3. Converte a resposta para objeto JavaScript
  const dados = await resposta.json();

  if (!dados || !Array.isArray(dados.results)) {
    return [];
  }

  // Retorna estritamente campos de texto para manter a listagem rápida
  return dados.results.map((game) => ({
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
 * Busca detalhes e URL da capa oficial de um jogo pelo ID na RAWG (sob demanda para a Fase 5).
 */
export async function buscarDetalhesJogoNaRawg(rawgId) {
  if (!rawgId) {
    return null;
  }

  const apiKey = obterChaveApi();
  const url = `${BASE_URL}/games/${encodeURIComponent(
    String(rawgId)
  )}?key=${encodeURIComponent(apiKey)}`;

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`Falha ao buscar detalhes do jogo (Status ${resposta.status}).`);
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
