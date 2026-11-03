import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import StarRatingInput from '../components/StarRatingInput';
import { useBacklog } from '../contexts/BacklogContext';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_OPTIONS = [
  'Jogando',
  'Zerado',
  'Abandonado',
  'Pausado',
  'Lista de Desejos',
];

export default function GameFormScreen({ route, navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const {
    adicionarJogo,
    editarJogo,
    excluirJogo,
    obterPreviewCapaCatalogo,
    salvando,
  } = useBacklog();

  const prefillGame = route?.params?.prefillGame || null;
  const existingGame = route?.params?.game || null;
  const isEditing = Boolean(existingGame?.id);

  // Estados dos campos do formulário
  const [title, setTitle] = useState(
    existingGame?.title || prefillGame?.title || ''
  );
  const [releaseYear, setReleaseYear] = useState(
    existingGame?.release_year ||
      (prefillGame?.release_year && prefillGame.release_year !== 'N/A'
        ? String(prefillGame.release_year)
        : '')
  );
  const [status, setStatus] = useState(
    STATUS_OPTIONS.includes(existingGame?.status)
      ? existingGame.status
      : 'Jogando'
  );
  const [rating, setRating] = useState(
    existingGame?.rating !== undefined ? Number(existingGame.rating) : 0
  );
  const [playtime, setPlaytime] = useState(
    existingGame?.playtime !== undefined && Number(existingGame.playtime) > 0
      ? String(existingGame.playtime)
      : ''
  );
  const [reviewText, setReviewText] = useState(existingGame?.review_text || '');

  // Estados de pré-visualização da capa (3 estados: Loading, Sucesso, Erro)
  const [remoteCoverUrl, setRemoteCoverUrl] = useState(
    prefillGame?.remote_cover_url || ''
  );
  const [carregandoCapa, setCarregandoCapa] = useState(false);
  const [erroCapa, setErroCapa] = useState('');
  const [erroFormulario, setErroFormulario] = useState('');

  const rawgId = existingGame?.rawg_id || prefillGame?.rawg_id || null;
  const localCoverUri = existingGame?.cover_uri || '';

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Gamestar • Editar Avaliação' : 'Gamestar • Nova Avaliação',
    });
  }, [isEditing, navigation]);

  // Ao selecionar um jogo da busca, busca a capa do catálogo para confirmação visual
  useEffect(() => {
    let ativo = true;

    async function carregarPreviewCapa() {
      if (localCoverUri || remoteCoverUrl || !rawgId) {
        return;
      }

      setCarregandoCapa(true);
      setErroCapa('');

      try {
        const detalhes = await obterPreviewCapaCatalogo(rawgId);
        if (!ativo) return;

        if (detalhes?.background_image) {
          setRemoteCoverUrl(detalhes.background_image);
        }
        if (!releaseYear && detalhes?.released) {
          setReleaseYear(String(detalhes.released).slice(0, 4));
        }
      } catch (e) {
        if (ativo) {
          setErroCapa('Prévia da capa indisponível no momento.');
        }
      } finally {
        if (ativo) {
          setCarregandoCapa(false);
        }
      }
    }

    carregarPreviewCapa();

    return () => {
      ativo = false;
    };
  }, [rawgId, localCoverUri, remoteCoverUrl, releaseYear, obterPreviewCapaCatalogo]);

  function handlePlaytimeChange(texto) {
    const apenasDigitos = texto.replace(/[^0-9]/g, '');
    setPlaytime(apenasDigitos);
  }

  async function handleSalvar() {
    const tituloLimpo = title.trim();
    if (!tituloLimpo) {
      setErroFormulario('Informe o título do jogo antes de salvar.');
      return;
    }

    setErroFormulario('');

    const payload = {
      rawg_id: rawgId,
      title: tituloLimpo,
      status,
      rating: Number(rating) || 0,
      playtime: parseInt(playtime, 10) || 0,
      review_text: reviewText.trim(),
      release_year: releaseYear.trim(),
      cover_uri: localCoverUri,
      remote_cover_url: remoteCoverUrl,
    };

    try {
      if (isEditing) {
        await editarJogo(existingGame.id, payload);
      } else {
        await adicionarJogo(payload);
      }

      navigation.navigate('Home');
    } catch (e) {
      setErroFormulario(
        e.message || 'Ocorreu um erro ao salvar os dados no banco local.'
      );
    }
  }

  function handleConfirmarExclusao() {
    if (!isEditing) return;

    Alert.alert(
      'Excluir Avaliação',
      `Tem certeza que deseja remover "${existingGame.title}" do seu backlog?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirJogo(existingGame.id, existingGame.cover_uri);
              navigation.navigate('Home');
            } catch (e) {
              setErroFormulario(
                e.message || 'Não foi possível excluir esta avaliação.'
              );
            }
          },
        },
      ]
    );
  }

  const uriCapaExibida = localCoverUri || remoteCoverUrl;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cartão de Cabeçalho e Confirmação Visual da Capa */}
        <View
          style={[
            styles.coverCard,
            shadow(2),
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
              gap: spacing.md,
            },
          ]}
        >
          <View
            style={[
              styles.coverThumbBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            {carregandoCapa ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : uriCapaExibida ? (
              <Image
                source={{ uri: uriCapaExibida }}
                style={styles.coverThumbImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <AppText variant="caption" tone="primary" style={styles.boldText}>
                  CAPA
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {erroCapa ? 'OFFLINE' : 'MANUAL'}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.coverMetaBox}>
            <Badge
              label={
                localCoverUri
                  ? 'CAPA SALVA OFFLINE'
                  : remoteCoverUrl
                  ? 'DOWNLOAD AUTOMÁTICO AO SALVAR'
                  : isEditing
                  ? 'EDITANDO REGISTRO'
                  : 'CADASTRO NO BACKLOG'
              }
              tone={localCoverUri ? 'success' : 'primary'}
            />
            <AppText variant="subtitle" numberOfLines={2}>
              {title.trim() || 'Novo Jogo no Backlog'}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={2}>
              {localCoverUri
                ? 'A imagem da capa já está armazenada no dispositivo.'
                : remoteCoverUrl
                ? 'Ao salvar, a capa será gravada localmente para leitura offline.'
                : erroCapa || 'Preencha os dados da sua avaliação abaixo.'}
            </AppText>
          </View>
        </View>

        {/* Mensagem de Erro (se houver) */}
        {erroFormulario ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger + '1A',
                borderColor: colors.danger,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <AppText variant="subtitle" tone="danger">
              Atenção
            </AppText>
            <AppText variant="body">{erroFormulario}</AppText>
          </View>
        ) : null}

        {/* Campo 1: Título e Ano */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Título do Jogo</AppText>
          <View style={[styles.rowInputs, { gap: spacing.sm }]}>
            <TextInput
              style={[
                styles.input,
                styles.flex,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                },
              ]}
              placeholder="Ex: Hollow Knight"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!salvando}
            />

            <TextInput
              style={[
                styles.input,
                styles.yearInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  color: colors.text,
                  paddingHorizontal: spacing.sm,
                },
              ]}
              placeholder="Ano"
              placeholderTextColor={colors.textMuted}
              value={releaseYear}
              onChangeText={(txt) => setReleaseYear(txt.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              editable={!salvando}
            />
          </View>
        </View>

        {/* Campo 2: Seletor de Status */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Status no Backlog</AppText>
          <View style={[styles.statusGrid, { gap: spacing.sm }]}>
            {STATUS_OPTIONS.map((opcao) => {
              const ativo = status === opcao;
              return (
                <View
                  key={opcao}
                  style={[
                    styles.statusChipWrapper,
                    {
                      borderRadius: radius.md,
                      borderColor: ativo ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => setStatus(opcao)}
                    disabled={salvando}
                    hitSlop={6}
                    android_ripple={{ color: 'rgba(102, 192, 244, 0.2)' }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={`Status ${opcao}`}
                    style={({ pressed }) => [
                      styles.statusChip,
                      {
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                        backgroundColor: ativo
                          ? colors.primary + '28'
                          : pressed
                          ? colors.cardPressed
                          : colors.surface,
                      },
                    ]}
                  >
                    <AppText
                      variant="body"
                      numberOfLines={1}
                      style={{
                        color: ativo ? colors.primary : colors.text,
                        fontWeight: ativo ? '700' : '500',
                      }}
                    >
                      {opcao}
                    </AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Campo 3: Nota Híbrida (0 a 5 com meias estrelas via Swipe/Toque) */}
        <StarRatingInput
          label="Sua Nota (0 a 5 Estrelas)"
          value={rating}
          onChange={setRating}
          disabled={salvando}
        />

        {/* Campo 4: Tempo de Jogo (Horas) */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Tempo de Jogo (Horas)</AppText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                paddingHorizontal: spacing.md,
              },
            ]}
            placeholder="Ex: 42"
            placeholderTextColor={colors.textMuted}
            value={playtime}
            onChangeText={handlePlaytimeChange}
            keyboardType="numeric"
            editable={!salvando}
          />
        </View>

        {/* Campo 5: Texto da Avaliação (Comentários) */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Avaliação e Comentários</AppText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
              },
            ]}
            placeholder="Escreva seus pontos fortes, impressões sobre a campanha, jogabilidade e trilha sonora..."
            placeholderTextColor={colors.textMuted}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!salvando}
          />
        </View>

        {/* Botões de Ação (Salvar e Excluir) */}
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Button
            label={
              salvando
                ? 'Salvando no banco local...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Salvar Avaliação no Backlog'
            }
            onPress={handleSalvar}
            disabled={salvando}
          />

          {isEditing ? (
            <View
              style={[
                styles.deleteButtonWrapper,
                {
                  borderRadius: radius.md,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Pressable
                onPress={handleConfirmarExclusao}
                disabled={salvando}
                hitSlop={8}
                android_ripple={{ color: 'rgba(229, 72, 77, 0.25)' }}
                accessibilityRole="button"
                accessibilityLabel="Excluir Avaliação"
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    paddingVertical: spacing.sm + 4,
                    backgroundColor: pressed
                      ? colors.danger + '33'
                      : colors.danger + '18',
                    opacity: salvando ? 0.5 : 1,
                  },
                ]}
              >
                <AppText
                  variant="body"
                  tone="danger"
                  style={styles.deleteButtonText}
                >
                  Excluir Avaliação
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  coverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  coverThumbBox: {
    width: 72,
    height: 92,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverThumbImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  coverMetaBox: {
    flex: 1,
    gap: 4,
  },
  boldText: {
    fontWeight: '800',
  },
  errorBanner: {
    borderWidth: 1,
    gap: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    fontSize: 14,
  },
  yearInput: {
    width: 92,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusChipWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusChip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButtonWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  deleteButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontWeight: '700',
  },
});
