/**
 * Dados mockados simulando a estrutura de resposta da API de catálogo (RAWG)
 * para testes de resiliência e uso em modo de demonstração offline.
 */
export const MOCK_RAWG_API_RESULTS = [
  {
    id: 3498,
    name: 'Grand Theft Auto V',
    released: '2013-09-17',
    background_image:
      'https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg',
    metacritic: 92,
    genres: [
      { id: 4, name: 'Action' },
      { id: 3, name: 'Adventure' },
    ],
    developers: [{ id: 10, name: 'Rockstar North' }],
  },
  {
    id: 4291,
    name: 'Hollow Knight',
    released: '2017-02-24',
    background_image:
      'https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg',
    metacritic: 90,
    genres: [
      { id: 4, name: 'Action' },
      { id: 51, name: 'Indie' },
      { id: 83, name: 'Platformer' },
    ],
    developers: [{ id: 14685, name: 'Team Cherry' }],
  },
  {
    id: 58175,
    name: 'God of War',
    released: '2018-04-20',
    background_image:
      'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg',
    metacritic: 94,
    genres: [
      { id: 4, name: 'Action' },
      { id: 5, name: 'RPG' },
    ],
    developers: [{ id: 9063, name: 'SIE Santa Monica Studio' }],
  },
];

/**
 * Converte um item no formato bruto da API para o modelo consumido pelo ViewModel/View.
 */
export function formatarJogoCatalogo(game) {
  const anoLancamento = game.released ? String(game.released).slice(0, 4) : 'N/A';
  const generosFormatados = Array.isArray(game.genres)
    ? game.genres.map((g) => (typeof g === 'string' ? g : g.name)).join(', ')
    : typeof game.genres === 'string'
    ? game.genres
    : '';

  return {
    id: game.id,
    rawg_id: game.rawg_id ?? game.id,
    name: game.name ?? game.title,
    title: game.title ?? game.name,
    released: anoLancamento,
    metacritic: game.metacritic ?? null,
    background_image: game.background_image || null,
    genres: generosFormatados,
  };
}

/**
 * Lista dos 3 jogos de demonstração mapeados para o formato padrão do app.
 */
export const mockGames = MOCK_RAWG_API_RESULTS.map(formatarJogoCatalogo);

/**
 * Filtra localmente o array de jogos mockados comparando de forma case-insensitive
 * o texto pesquisado exclusivamente com o nome real do jogo.
 * @param {string} termoBusca Texto digitado pelo usuário
 * @returns {Array} Jogos correspondentes
 */
export function filtrarJogosMockPorNome(termoBusca) {
  const termoNormalizado = String(termoBusca || '').trim().toLowerCase();
  if (!termoNormalizado) {
    return [];
  }

  return mockGames.filter((jogo) => {
    const nomeReal = String(jogo.title || jogo.name || '').toLowerCase();
    return nomeReal.includes(termoNormalizado);
  });
}

export default mockGames;
