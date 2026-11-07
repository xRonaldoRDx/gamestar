import { useCallback, useState } from 'react';
import { searchCatalogGames, searchIgdbGames } from '../services/games';
import { toFriendlyMessage } from '../services/supabase';

export function useGamesSearch(initialQuery = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogGames, setCatalogGames] = useState([]);
  const [igdbGames, setIgdbGames] = useState([]);
  const [error, setError] = useState('');
  const [igdbWarning, setIgdbWarning] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const resetSearch = useCallback(() => {
    setSearchQuery(initialQuery);
    setCatalogGames([]);
    setIgdbGames([]);
    setError('');
    setIgdbWarning('');
    setHasSearched(false);
    setIsLoading(false);
  }, [initialQuery]);

  const searchGames = useCallback(async (queryOverride) => {
    const trimmedQuery = (typeof queryOverride === 'string' ? queryOverride : searchQuery).trim();
    if (!trimmedQuery) {
      setError('Digite o nome de um jogo para pesquisar.');
      return;
    }

    setIsLoading(true);
    setError('');
    setIgdbWarning('');
    setHasSearched(true);

    const [catalogResult, igdbResult] = await Promise.allSettled([
      searchCatalogGames(trimmedQuery),
      searchIgdbGames(trimmedQuery),
    ]);

    if (catalogResult.status === 'rejected') {
      setError(toFriendlyMessage(catalogResult.reason, 'Não foi possível buscar na base do Gamestar.'));
      setCatalogGames([]);
      setIgdbGames([]);
      setIsLoading(false);
      return;
    }

    const catalog = catalogResult.value;
    const importedIgdbIds = new Set(catalog.map((game) => game.igdb_id).filter(Boolean));
    setCatalogGames(catalog);

    if (igdbResult.status === 'fulfilled') {
      setIgdbGames(igdbResult.value.filter((game) => !importedIgdbIds.has(game.igdb_id)));
    } else {
      setIgdbGames([]);
      setIgdbWarning(igdbResult.reason?.message || 'O catálogo IGDB não respondeu agora.');
    }

    setIsLoading(false);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    isLoading,
    catalogGames,
    igdbGames,
    error,
    igdbWarning,
    hasSearched,
    searchGames,
    resetSearch,
  };
}
