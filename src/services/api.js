const BASE_URL = 'https://api.rawg.io/api';

/**
 * Consome silenciosamente a chave configurada no ambiente (.env).
 * Nunca expõe detalhes de configuração para o usuário final.
 */
function obterChaveApi() {
  const apiKey = process.env.EXPO_PUBLIC_RAWG_API_KEY?.trim();

  if (!apiKey) {
    console.error('[API Service] Chave de API ausente na variável EXPO_PUBLIC_RAWG_API_KEY.');
    throw new Error('Catálogo de jogos temporariamente indisponível. Tente novamente mais tarde.');
  }

  return apiKey;
}

/**
 * Busca jogos no catálogo remoto pelo nome retornando apenas metadados textuais leves.
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

  let resposta;
  try {
    resposta = await fetch(url);
  } catch (err) {
    console.error('[API Service] Erro de rede:', err);
    throw new Error('Falha de conexão. Verifique sua internet e tente novamente.');
  }

  if (!resposta.ok) {
    if (resposta.status === 401) {
      console.error('[API Service] Chave não autorizada pelo provedor.');
      throw new Error('Serviço de catálogo em manutenção. Tente novamente mais tarde.');
    }
    throw new Error('Não foi possível obter resultados no catálogo no momento.');
  }

  const dados = await resposta.json();

  if (!dados || !Array.isArray(dados.results)) {
    return [];
  }

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
 * Busca detalhes e URL da capa oficial de um jogo pelo ID no catálogo.
 */
export async function buscarDetalhesJogoNaRawg(rawgId) {
  if (!rawgId) {
    return null;
  }

  const apiKey = obterChaveApi();
  const url = `${BASE_URL}/games/${encodeURIComponent(
    String(rawgId)
  )}?key=${encodeURIComponent(apiKey)}`;

  let resposta;
  try {
    resposta = await fetch(url);
  } catch (err) {
    console.error('[API Service] Erro de rede ao buscar detalhes:', err);
    throw new Error('Falha de conexão ao carregar detalhes do jogo.');
  }

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
