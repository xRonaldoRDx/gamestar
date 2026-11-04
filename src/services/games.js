import { FunctionsHttpError } from '@supabase/supabase-js';
import { ensureNetworkConnection } from './network';
import { supabase } from './supabase';

// Keys are stored in the database; labels follow the options defined for the review form
export const GAME_STATUS = {
  playing: { label: 'Jogando', tone: 'primary' },
  completed: { label: 'Zerado', tone: 'success' },
  dropped: { label: 'Abandonado', tone: 'danger' },
  paused: { label: 'Pausado', tone: 'warning' },
  wishlist: { label: 'Lista de Desejos', tone: 'neutral' },
};

export const STATUS_KEYS = Object.keys(GAME_STATUS);

export const GAME_SOURCE_LABEL = {
  igdb: 'IGDB',
  steam: 'Steam',
  admin: 'Gamestar',
};

const GAME_FIELDS =
  'id, igdb_id, title, release_year, cover_url, genres, developer, platforms, summary, critic_rating, source, updated_at';

// Mirrors REFRESH_AFTER_MS in the catalog Edge Function
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

// Escapes LIKE wildcards so the search term is matched literally
function escapeLikePattern(text) {
  return text.replace(/[%_\\]/g, (char) => `\\${char}`);
}

// The Edge Function answers errors as { error: message }; surfaces that message to the UI
async function invokeCatalog(body) {
  await ensureNetworkConnection();

  const { data, error } = await supabase.functions.invoke('catalog', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error || 'Catálogo de jogos indisponível no momento.');
    }
    throw new Error('Não foi possível conectar ao catálogo de jogos.');
  }
  return data;
}

export async function searchCatalogGames(searchQuery) {
  const trimmedQuery = (searchQuery || '').trim();
  if (!trimmedQuery) return [];

  const { data, error } = await supabase
    .from('games')
    .select(GAME_FIELDS)
    .ilike('title', `%${escapeLikePattern(trimmedQuery)}%`)
    .order('title')
    .limit(20);

  if (error) throw error;
  return data;
}

export async function getGameById(gameId) {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_FIELDS)
    .eq('id', gameId)
    .single();

  if (error) throw error;
  return data;
}

export async function searchIgdbGames(searchQuery) {
  const trimmedQuery = (searchQuery || '').trim();
  if (!trimmedQuery) return [];

  const { games } = await invokeCatalog({ action: 'search', query: trimmedQuery });
  return games;
}

/**
 * Adds an IGDB game to the shared catalog (or returns the existing row).
 */
export async function importIgdbGame(igdbId) {
  const { game } = await invokeCatalog({ action: 'import', igdbId });
  return game;
}

export function isGameStale(game) {
  return (
    game.source === 'igdb' &&
    Date.now() - new Date(game.updated_at).getTime() > REFRESH_AFTER_MS
  );
}

/**
 * Admin-only: registers a game that is not on IGDB. RLS rejects non-admins.
 */
export async function createAdminGame({ title, release_year, platforms, genres, developer, cover_url }) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      title: title.trim(),
      release_year: release_year ? Number(release_year) : null,
      platforms: (platforms || '').trim(),
      genres: (genres || '').trim(),
      developer: (developer || '').trim(),
      cover_url: (cover_url || '').trim() || null,
      source: 'admin',
    })
    .select(GAME_FIELDS)
    .single();

  if (error) throw error;
  return data;
}
