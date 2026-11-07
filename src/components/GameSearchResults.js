import React from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import GameCover from './GameCover';
import { GAME_SOURCE_LABEL } from '../services/games';
import { useTheme } from '../theme/ThemeProvider';

function describeGame(game) {
  return [game.release_year, game.platforms].filter(Boolean).join(' · ');
}

/**
 * Two-section result list (catalog + IGDB) shared by the search screen
 * and the admin request screen.
 */
export default function GameSearchResults({
  catalogGames,
  igdbGames,
  importingIgdbId,
  onPressCatalogGame,
  onPressIgdbGame,
  ListHeaderComponent,
  ListFooterComponent,
}) {
  const { spacing } = useTheme();

  const sections = [];
  if (catalogGames.length) {
    sections.push({ key: 'catalog', title: 'Na base do Gamestar', data: catalogGames });
  }
  if (igdbGames.length) {
    sections.push({ key: 'igdb', title: 'Catálogo IGDB', data: igdbGames });
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => (item.id ? `catalog-${item.id}` : `igdb-${item.igdb_id}`)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <AppText
          variant="caption"
          tone="muted"
          style={[styles.sectionTitle, { marginTop: spacing.sm, marginBottom: spacing.sm }]}
        >
          {section.title.toUpperCase()}
        </AppText>
      )}
      renderItem={({ item, section }) =>
        section.key === 'catalog' ? (
          <ResultRow
            game={item}
            badge={
              item.source !== 'igdb' ? (
                <Badge label={GAME_SOURCE_LABEL[item.source]} tone="neutral" />
              ) : null
            }
            onPress={() => onPressCatalogGame(item)}
          />
        ) : (
          <ResultRow
            game={item}
            isLoading={importingIgdbId === item.igdb_id}
            disabled={importingIgdbId != null}
            onPress={() => onPressIgdbGame(item)}
          />
        )
      }
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

function ResultRow({ game, badge, onPress, isLoading = false, disabled = false }) {
  const { colors, spacing, radius } = useTheme();
  const subtitle = describeGame(game);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${game.title}`}
      style={({ pressed }) => [
        styles.row,
        {
          gap: spacing.md,
          padding: spacing.sm + 2,
          marginBottom: spacing.sm,
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.cardPressed : colors.card,
          opacity: disabled && !isLoading ? 0.6 : 1,
        },
      ]}
    >
      <GameCover uri={game.cover_url} width={44} />
      <View style={[styles.flex, { gap: 2 }]}>
        <AppText variant="subtitle" numberOfLines={2}>
          {game.title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {badge}
      </View>
      {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
