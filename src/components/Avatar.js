import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { buildCacheBustedAvatarUrl } from '../services/profiles';
import { useTheme } from '../theme/ThemeProvider';

export function isValidAvatarUri(avatarUrl) {
  if (typeof avatarUrl !== 'string') return false;
  const trimmed = avatarUrl.trim();
  return trimmed.length > 0 && /^https?:\/\/.+/i.test(trimmed);
}

export default function Avatar({ profile, size = 44 }) {
  const { colors } = useTheme();
  const [hasImageError, setHasImageError] = useState(false);

  const candidateUri = profile?.avatarUrl ?? profile?.avatar_url ?? null;
  const rawAvatarUrl = isValidAvatarUri(candidateUri) ? candidateUri.trim() : null;

  const cacheBustedUri = useMemo(() => {
    if (!rawAvatarUrl) return null;
    if (rawAvatarUrl.includes('?t=') || rawAvatarUrl.includes('&t=')) {
      return rawAvatarUrl;
    }
    return buildCacheBustedAvatarUrl(rawAvatarUrl);
  }, [rawAvatarUrl]);

  const shouldRenderImage = Boolean(cacheBustedUri) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [cacheBustedUri]);

  const displayName =
    typeof profile?.displayName === 'string' && profile.displayName.trim()
      ? profile.displayName.trim()
      : typeof profile?.display_name === 'string' && profile.display_name.trim()
      ? profile.display_name.trim()
      : typeof profile?.username === 'string' && profile.username.trim()
      ? profile.username.trim()
      : '';

  const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '';

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {shouldRenderImage ? (
        <Image
          key={cacheBustedUri}
          source={{ uri: cacheBustedUri }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
          accessibilityIgnoresInvertColors
        />
      ) : firstLetter ? (
        <AppText
          variant="subtitle"
          style={[
            styles.initialText,
            {
              color: colors.text,
              fontSize: Math.round(size * 0.42),
              lineHeight: Math.round(size * 0.52),
            },
          ]}
        >
          {firstLetter}
        </AppText>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.48)} color={colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialText: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
