import { useCallback, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { fetchGamesFromApi } from '../services/api';
import { filterMockGamesByTitle } from '../services/mockGames';

export function useGamesSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const searchGames = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setError('Digite o nome de um jogo para pesquisar.');
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      if (isMockMode) {
        const localResults = filterMockGamesByTitle(trimmedQuery);
        setGames(localResults);
        return;
      }

      const netState = await NetInfo.fetch();
      if (netState.isConnected === false || netState.isInternetReachable === false) {
        throw new Error(
          'Não foi possível conectar ao servidor de jogos. Verifique sua conexão com a internet.'
        );
      }

      const remoteResults = await fetchGamesFromApi(trimmedQuery);
      setGames(remoteResults);
    } catch (err) {
      setError(err.message || 'Não foi possível conectar ao servidor de jogos.');
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isMockMode]);

  const enableMockMode = useCallback(() => {
    setIsMockMode(true);
    setError('');
    setIsLoading(false);
    setGames([]);
    setHasSearched(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    isLoading,
    games,
    error,
    hasSearched,
    isMockMode,
    searchGames,
    enableMockMode,
  };
}
