import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';

const AVATAR_COLORS = ['#66C0F4', '#A4D007', '#F2A93B', '#E5484D', '#B78BF5', '#4FD1C5'];

// Color is derived from the username so each person always gets the same one
function pickColor(username = '') {
  const seed = [...username].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

export default function Avatar({ profile, size = 44 }) {
  const name = profile?.display_name || profile?.username || '?';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const color = pickColor(profile?.username);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '33',
          borderColor: color,
        },
      ]}
    >
      <AppText
        variant="subtitle"
        style={{ color, fontSize: size * 0.38, lineHeight: size * 0.5, fontWeight: '800' }}
      >
        {initials || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
