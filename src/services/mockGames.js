export const MOCK_RAWG_GAMES = [
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

// Adapter pattern: normalizes external provider payloads into the internal domain shape
export function mapCatalogGame(rawGame) {
  const releaseYear = rawGame.released ? String(rawGame.released).slice(0, 4) : 'N/A';
  const formattedGenres = Array.isArray(rawGame.genres)
    ? rawGame.genres.map((genre) => (typeof genre === 'string' ? genre : genre.name)).join(', ')
    : typeof rawGame.genres === 'string'
    ? rawGame.genres
    : '';

  return {
    id: rawGame.id,
    rawg_id: rawGame.rawg_id ?? rawGame.id,
    name: rawGame.name ?? rawGame.title,
    title: rawGame.title ?? rawGame.name,
    released: releaseYear,
    metacritic: rawGame.metacritic ?? null,
    background_image: rawGame.background_image || null,
    genres: formattedGenres,
  };
}

export const mockGamesList = MOCK_RAWG_GAMES.map(mapCatalogGame);

export function filterMockGamesByTitle(searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return mockGamesList.filter((game) => {
    const gameTitle = String(game.title || game.name || '').toLowerCase();
    return gameTitle.includes(normalizedQuery);
  });
}

export default mockGamesList;
