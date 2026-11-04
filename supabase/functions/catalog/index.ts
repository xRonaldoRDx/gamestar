// Supabase Edge Function: searches IGDB and imports games into the shared catalog.
// The Twitch/IGDB client secret lives only here (Edge Function secrets), never in the app.
//
// Required secrets: IGDB_CLIENT_ID, IGDB_CLIENT_SECRET
// Actions (POST JSON body):
//   { action: 'search', query: string }  -> IGDB results not yet in the catalog shape
//   { action: 'import', igdbId: number } -> catalog row (inserted, refreshed or existing)

import { createClient } from 'npm:@supabase/supabase-js@2';

const IGDB_URL = 'https://api.igdb.com/v4/games';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const COVER_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big';
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const SEARCH_LIMIT = 20;

const GAME_FIELDS = [
  'name',
  'summary',
  'first_release_date',
  'aggregated_rating',
  'cover.image_id',
  'genres.name',
  'platforms.abbreviation',
  'platforms.name',
  'involved_companies.developer',
  'involved_companies.company.name',
].join(',');

const CATALOG_FIELDS =
  'id, igdb_id, title, release_year, cover_url, genres, developer, platforms, summary, critic_rating, source, updated_at';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const publishableKey = firstKey('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
const secretKey = firstKey('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Secret client bypasses RLS: only this function writes IGDB games to the catalog
const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false },
});

// New-style keys come as a JSON dictionary, e.g. {"default": "sb_secret_..."}
function firstKey(envName: string): string | null {
  const raw = Deno.env.get(envName);
  if (!raw) return null;
  try {
    const keys = JSON.parse(raw);
    return keys.default ?? Object.values(keys)[0] ?? null;
  } catch {
    return null;
  }
}

// Twitch app tokens last ~60 days; cached per function instance
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getTwitchToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    client_id: Deno.env.get('IGDB_CLIENT_ID') ?? '',
    client_secret: Deno.env.get('IGDB_CLIENT_SECRET') ?? '',
    grant_type: 'client_credentials',
  });

  const response = await fetch(`${TWITCH_TOKEN_URL}?${params}`, { method: 'POST' });
  if (!response.ok) {
    console.error('[catalog] Twitch token error', response.status, await response.text());
    throw new HttpError(502, 'Catálogo de jogos indisponível no momento.');
  }

  const body = await response.json();
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

async function queryIgdb(body: string) {
  const token = await getTwitchToken();
  const response = await fetch(IGDB_URL, {
    method: 'POST',
    headers: {
      'Client-ID': Deno.env.get('IGDB_CLIENT_ID') ?? '',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body,
  });

  if (response.status === 401) cachedToken = null;
  if (!response.ok) {
    console.error('[catalog] IGDB error', response.status, await response.text());
    throw new HttpError(502, 'Catálogo de jogos indisponível no momento.');
  }
  return response.json();
}

// deno-lint-ignore no-explicit-any
function toCatalogRow(game: any) {
  const developers = (game.involved_companies ?? [])
    .filter((company: { developer?: boolean }) => company.developer)
    .map((company: { company?: { name?: string } }) => company.company?.name)
    .filter(Boolean);

  return {
    igdb_id: game.id,
    title: String(game.name).slice(0, 120),
    release_year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null,
    cover_url: game.cover?.image_id ? `${COVER_URL}/${game.cover.image_id}.jpg` : null,
    genres: (game.genres ?? []).map((genre: { name: string }) => genre.name).join(', '),
    developer: developers.join(', '),
    platforms: (game.platforms ?? [])
      .map((platform: { abbreviation?: string; name?: string }) => platform.abbreviation ?? platform.name)
      .filter(Boolean)
      .join(', '),
    summary: game.summary ?? '',
    // IGDB critic scores are 0-100; the app uses 0-5 in half steps
    critic_rating: game.aggregated_rating
      ? Math.max(0.5, Math.round((game.aggregated_rating / 20) * 2) / 2)
      : null,
  };
}

async function searchGames(query: string) {
  // Quotes and backslashes would break the Apicalypse query string
  const safeQuery = query.replace(/["\\]/g, '').trim().slice(0, 80);
  if (!safeQuery) return [];

  // version_parent = null hides editions such as "Game of the Year Edition"
  const results = await queryIgdb(
    `search "${safeQuery}"; fields ${GAME_FIELDS}; where version_parent = null; limit ${SEARCH_LIMIT};`
  );
  return results.map(toCatalogRow);
}

async function importGame(igdbId: number) {
  const { data: existing, error: selectError } = await adminClient
    .from('games')
    .select(CATALOG_FIELDS)
    .eq('igdb_id', igdbId)
    .maybeSingle();
  if (selectError) throw selectError;

  const isFresh =
    existing && Date.now() - new Date(existing.updated_at).getTime() < REFRESH_AFTER_MS;
  if (isFresh) return existing;

  const [game] = await queryIgdb(`fields ${GAME_FIELDS}; where id = ${igdbId}; limit 1;`);
  if (!game) {
    // Keep serving the stored copy if IGDB no longer has the game
    if (existing) return existing;
    throw new HttpError(404, 'Jogo não encontrado no catálogo.');
  }

  const row = { ...toCatalogRow(game), source: 'igdb', updated_at: new Date().toISOString() };
  const { data, error } = await adminClient
    .from('games')
    .upsert(row, { onConflict: 'igdb_id' })
    .select(CATALOG_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405);
  }

  try {
    // Only signed-in users of the app may use the catalog
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return json({ error: 'Faça login para continuar.' }, 401);
    }

    const { action, query, igdbId } = await request.json();

    if (action === 'search') {
      return json({ games: await searchGames(String(query ?? '')) });
    }
    if (action === 'import' && Number.isInteger(igdbId)) {
      return json({ game: await importGame(igdbId) });
    }
    return json({ error: 'Ação inválida.' }, 400);
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[catalog] Unexpected error', error);
    return json({ error: 'Erro inesperado no catálogo.' }, 500);
  }
});
