import { supabase } from './supabase';

export const REQUEST_STATUS = {
  pending: { label: 'Em análise', tone: 'warning' },
  approved: { label: 'Adicionado', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
};

const REQUEST_FIELDS = `
  id, title, platform, note, status, game_id, created_at, resolved_at, requested_by,
  requester:profiles (id, username, display_name)
`;

export async function createGameRequest({ title, platform, note }) {
  const { error } = await supabase.from('game_requests').insert({
    title: title.trim(),
    platform: (platform || '').trim(),
    note: (note || '').trim(),
  });
  if (error) throw error;
}

export async function getMyGameRequests(userId) {
  const { data, error } = await supabase
    .from('game_requests')
    .select(REQUEST_FIELDS)
    .eq('requested_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Admin-only: pending requests grouped by title, most requested first.
 * RLS returns only the admin's own requests to everyone else.
 */
export async function getPendingRequestGroups() {
  const { data, error } = await supabase
    .from('game_requests')
    .select(REQUEST_FIELDS)
    .eq('status', 'pending')
    .order('created_at');

  if (error) throw error;

  const groups = new Map();
  for (const request of data) {
    const key = request.title.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { key, title: request.title, requests: [] });
    }
    groups.get(key).requests.push(request);
  }

  return [...groups.values()].sort((a, b) => b.requests.length - a.requests.length);
}

/**
 * Admin-only: resolves every request in a group at once.
 */
export async function resolveGameRequests(requestIds, { status, gameId = null }) {
  const { error } = await supabase
    .from('game_requests')
    .update({ status, game_id: gameId, resolved_at: new Date().toISOString() })
    .in('id', requestIds);

  if (error) throw error;
}
