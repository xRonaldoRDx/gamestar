import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  deleteBacklogGame,
  getAllBacklogGames,
  initDatabase,
  insertBacklogGame,
  updateBacklogGame,
  updateBacklogLocalCover,
} from '../database/database';
import { fetchGameDetailsFromApi } from '../services/api';
import { deleteLocalCover, saveLocalCover } from '../services/imageStorage';

export const BacklogContext = createContext(null);

export const BacklogProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBacklog = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const backlogList = await getAllBacklogGames();
      setGames(backlogList);
    } catch (err) {
      console.error('[BacklogContext] Failed to load backlog:', err);
      setError(err.message || 'Não foi possível carregar os jogos do banco local.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initDatabase()
      .then(() => loadBacklog())
      .catch((err) => {
        console.error('[BacklogContext] Failed to initialize database:', err);
        setError(err.message || 'Falha ao inicializar o banco SQLite.');
        setIsLoading(false);
      });
  }, [loadBacklog]);

  const fetchCatalogCoverPreview = useCallback(async (rawgId) => {
    if (!rawgId) return null;
    return await fetchGameDetailsFromApi(rawgId);
  }, []);

  const downloadAndSaveLocalCover = useCallback(
    async (remoteImageUrl, gameKey, backlogId = null) => {
      if (!remoteImageUrl) {
        return '';
      }

      const localUri = await saveLocalCover(
        remoteImageUrl,
        gameKey || Date.now()
      );

      if (localUri && backlogId) {
        await updateBacklogLocalCover(backlogId, localUri);
        await loadBacklog();
      }

      return localUri;
    },
    [loadBacklog]
  );

  // Persists remote cover images into local file storage on save so the Backlog FlatList works 100% offline
  const addGame = useCallback(
    async (gameData) => {
      setIsSaving(true);
      setError('');

      try {
        let localCoverUri = gameData.cover_uri || '';
        let remoteCoverUrl = gameData.remote_cover_url || '';

        if (!localCoverUri && !remoteCoverUrl && gameData.rawg_id) {
          try {
            const details = await fetchGameDetailsFromApi(gameData.rawg_id);
            if (details?.background_image) {
              remoteCoverUrl = details.background_image;
            }
          } catch (apiError) {
            console.warn('[BacklogContext] Could not fetch cover URL:', apiError);
          }
        }

        if (!localCoverUri && remoteCoverUrl) {
          localCoverUri = await saveLocalCover(
            remoteCoverUrl,
            gameData.rawg_id || Date.now()
          );
        }

        const insertedId = await insertBacklogGame({
          rawg_id: gameData.rawg_id,
          title: gameData.title,
          status: gameData.status,
          rating: gameData.rating,
          playtime: gameData.playtime,
          achievements: gameData.achievements || 0,
          review_text: gameData.review_text,
          cover_uri: localCoverUri,
          release_year: gameData.release_year,
        });

        await loadBacklog();
        return { success: true, id: insertedId };
      } catch (err) {
        console.error('[BacklogContext] Failed to insert game:', err);
        const message = err.message || 'Não foi possível salvar a avaliação no banco local.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [loadBacklog]
  );

  const updateGame = useCallback(
    async (id, gameData) => {
      setIsSaving(true);
      setError('');

      try {
        let localCoverUri = gameData.cover_uri || '';

        if (!localCoverUri && gameData.remote_cover_url) {
          localCoverUri = await saveLocalCover(
            gameData.remote_cover_url,
            gameData.rawg_id || id
          );
        }

        await updateBacklogGame(id, {
          title: gameData.title,
          status: gameData.status,
          rating: gameData.rating,
          playtime: gameData.playtime,
          achievements: gameData.achievements || 0,
          review_text: gameData.review_text,
          cover_uri: localCoverUri,
          release_year: gameData.release_year,
        });

        await loadBacklog();
        return { success: true };
      } catch (err) {
        console.error('[BacklogContext] Failed to update game:', err);
        const message = err.message || 'Não foi possível atualizar a avaliação.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [loadBacklog]
  );

  const removeGame = useCallback(
    async (id, coverUri = '') => {
      setIsSaving(true);
      setError('');

      try {
        if (coverUri && coverUri.startsWith('file://')) {
          await deleteLocalCover(coverUri);
        }

        await deleteBacklogGame(id);
        await loadBacklog();
        return { success: true };
      } catch (err) {
        console.error('[BacklogContext] Failed to delete game:', err);
        const message = err.message || 'Não foi possível excluir a avaliação.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [loadBacklog]
  );

  return (
    <BacklogContext.Provider
      value={{
        games,
        isLoading,
        isSaving,
        error,
        loadBacklog,
        addGame,
        updateGame,
        removeGame,
        fetchCatalogCoverPreview,
        downloadAndSaveLocalCover,
      }}
    >
      {children}
    </BacklogContext.Provider>
  );
};

export function useBacklog() {
  const context = useContext(BacklogContext);
  if (!context) {
    throw new Error('useBacklog must be used within a <BacklogProvider>.');
  }
  return context;
}
