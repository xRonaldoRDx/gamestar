import { supabase } from './supabase';

const PROFILE_FIELDS = 'id, username, display_name, bio, avatar_url, is_admin, created_at';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const STORAGE_BUCKET = 'avatars';
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function decodeBase64ToArrayBuffer(base64String) {
  const sanitized = base64String.replace(/^data:[^;]+;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');
  const paddingLength = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
  const byteLength = Math.floor((sanitized.length * 3) / 4) - paddingLength;
  const bytes = new Uint8Array(byteLength);

  let byteIndex = 0;
  for (let i = 0; i < sanitized.length; i += 4) {
    const encoded1 = BASE64_CHARS.indexOf(sanitized.charAt(i));
    const encoded2 = BASE64_CHARS.indexOf(sanitized.charAt(i + 1));
    const encoded3 = BASE64_CHARS.indexOf(sanitized.charAt(i + 2));
    const encoded4 = BASE64_CHARS.indexOf(sanitized.charAt(i + 3));

    const triplet =
      (encoded1 << 18) |
      (encoded2 << 12) |
      ((encoded3 > -1 ? encoded3 : 0) << 6) |
      (encoded4 > -1 ? encoded4 : 0);

    if (byteIndex < byteLength) bytes[byteIndex++] = (triplet >> 16) & 0xff;
    if (byteIndex < byteLength) bytes[byteIndex++] = (triplet >> 8) & 0xff;
    if (byteIndex < byteLength) bytes[byteIndex++] = triplet & 0xff;
  }

  return bytes.buffer;
}

function resolveFileExtension(uri = '', mimeType = '') {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    const extension = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
  }
  return 'jpg';
}

function resolveContentType(extension, mimeType = '') {
  if (mimeType && mimeType.startsWith('image/')) return mimeType;
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function buildCacheBustedAvatarUrl(avatarUrl, timestamp = Date.now()) {
  if (typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed || !/^https?:\/\/.+/i.test(trimmed)) return null;
  const baseUrl = trimmed.split('?')[0];
  return `${baseUrl}?t=${timestamp}`;
}

function normalizeAvatarUrl(avatarUrl) {
  if (avatarUrl === null || avatarUrl === undefined) return null;
  if (typeof avatarUrl === 'string') {
    const trimmed = avatarUrl.trim();
    return trimmed.length > 0 && /^https?:\/\/.+/i.test(trimmed) ? trimmed : null;
  }
  return null;
}

export function normalizeProfileRow(profile) {
  if (!profile) return profile;
  const normalizedUrl = normalizeAvatarUrl(profile.avatar_url ?? profile.avatarUrl);
  const displayName =
    typeof profile.display_name === 'string'
      ? profile.display_name
      : typeof profile.displayName === 'string'
      ? profile.displayName
      : '';

  return {
    ...profile,
    display_name: displayName,
    displayName,
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    avatar_url: normalizedUrl,
    avatarUrl: normalizedUrl,
  };
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return normalizeProfileRow(data);
}

export async function isUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

export async function searchProfiles(searchQuery) {
  const sanitizedQuery = (searchQuery || '').trim().toLowerCase().replace(/[,()]/g, '');
  const escapedQuery = sanitizedQuery.replace(/[%_\\]/g, (char) => `\\${char}`);

  let request = supabase.from('profiles').select(PROFILE_FIELDS).order('username').limit(30);
  if (escapedQuery) {
    request = request.or(
      `username.ilike.%${escapedQuery}%,display_name.ilike.%${escapedQuery}%`
    );
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map(normalizeProfileRow);
}

export async function updateProfile(userId, { display_name, bio, avatar_url, avatarUrl }) {
  const updates = {};

  if (typeof display_name === 'string') {
    updates.display_name = display_name.trim();
  }
  if (typeof bio === 'string') {
    updates.bio = bio.trim();
  }

  const resolvedAvatarInput = avatar_url !== undefined ? avatar_url : avatarUrl;
  if (resolvedAvatarInput !== undefined) {
    updates.avatar_url = normalizeAvatarUrl(resolvedAvatarInput);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single();

  if (error) throw error;
  return normalizeProfileRow(data);
}

export async function uploadProfileAvatar(userId, imageAsset) {
  const imageUri = typeof imageAsset === 'string' ? imageAsset : imageAsset?.uri;
  const mimeType = typeof imageAsset === 'object' ? imageAsset?.mimeType : '';
  const base64Data = typeof imageAsset === 'object' ? imageAsset?.base64 : null;

  if (!userId || !imageUri) {
    throw new Error('Não foi possível enviar a imagem. Tente novamente.');
  }

  try {
    const extension = resolveFileExtension(imageUri, mimeType);
    const contentType = resolveContentType(extension, mimeType);
    const filePath = `${userId}/avatar.${extension}`;

    let filePayload;
    if (typeof base64Data === 'string' && base64Data.length > 0) {
      filePayload = decodeBase64ToArrayBuffer(base64Data);
    } else {
      const response = await fetch(imageUri);
      filePayload = await response.blob();
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, filePayload, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const rawPublicUrl = publicUrlData?.publicUrl;
    if (!rawPublicUrl) {
      throw new Error('Public URL generation failed');
    }

    const updatedProfile = await updateProfile(userId, { avatar_url: rawPublicUrl });
    const cacheBustedUrl = buildCacheBustedAvatarUrl(rawPublicUrl, Date.now());

    return {
      ...updatedProfile,
      avatar_url: cacheBustedUrl,
      avatarUrl: cacheBustedUrl,
    };
  } catch {
    throw new Error('Não foi possível enviar a imagem. Tente novamente.');
  }
}

export async function removeProfileAvatar(userId) {
  if (!userId) {
    throw new Error('Não foi possível remover a foto. Tente novamente.');
  }

  try {
    const candidatePaths = [
      `${userId}/avatar.jpg`,
      `${userId}/avatar.png`,
      `${userId}/avatar.webp`,
    ];

    await supabase.storage.from(STORAGE_BUCKET).remove(candidatePaths);

    return await updateProfile(userId, { avatar_url: null });
  } catch {
    throw new Error('Não foi possível remover a foto. Tente novamente.');
  }
}

export async function getProfileStats(userId) {
  const countRows = (table, column, applyFilter) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, userId);
    if (applyFilter) query = applyFilter(query);
    return query;
  };

  const results = await Promise.all([
    countRows('user_games', 'user_id'),
    countRows('user_games', 'user_id', (query) => query.eq('status', 'completed')),
    countRows('follows', 'following_id'),
    countRows('follows', 'follower_id'),
  ]);

  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  const [total, completed, followers, following] = results.map((result) => result.count ?? 0);
  return { total, completed, followers, following };
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function followUser(followingId) {
  const { error } = await supabase.from('follows').insert({ following_id: followingId });
  if (error && error.code !== '23505') throw error;
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}
