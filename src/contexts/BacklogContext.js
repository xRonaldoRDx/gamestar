import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  atualizarCapaLocalBacklog,
  atualizarJogoBacklog,
  deletarJogoBacklog,
  initDB,
  inserirJogoBacklog,
  listarJogosBacklog,
} from '../database/database';
import { buscarDetalhesJogoNaRawg } from '../services/api';
import { removerCapaLocal, salvarCapaLocal } from '../services/imageStorage';

export const BacklogContext = createContext(null);

export const BacklogProvider = ({ children }) => {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregarBacklog = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const lista = await listarJogosBacklog();
      setJogos(lista);
    } catch (e) {
      console.error('[BacklogContext] Erro ao carregar backlog:', e);
      setErro(e.message || 'Não foi possível carregar os jogos do banco local.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    initDB()
      .then(() => carregarBacklog())
      .catch((e) => {
        console.error('[BacklogContext] Erro ao inicializar banco:', e);
        setErro(e.message || 'Falha ao inicializar o banco SQLite.');
        setCarregando(false);
      });
  }, [carregarBacklog]);

  /**
   * Busca metadados visuais (URL da capa e ano de lançamento) de um jogo do catálogo
   * para confirmação visual antes de salvar no banco local.
   */
  const obterPreviewCapaCatalogo = useCallback(async (rawgId) => {
    if (!rawgId) return null;
    return await buscarDetalhesJogoNaRawg(rawgId);
  }, []);

  /**
   * Orquestra o download de uma capa remota para o sistema de arquivos local
   * via expo-file-system e retorna a URI local (file://...).
   */
  const baixarESalvarCapaLocal = useCallback(
    async (remoteImageUrl, gameKey, backlogId = null) => {
      if (!remoteImageUrl) {
        return '';
      }

      const localUri = await salvarCapaLocal(
        remoteImageUrl,
        gameKey || Date.now()
      );

      if (localUri && backlogId) {
        await atualizarCapaLocalBacklog(backlogId, localUri);
        await carregarBacklog();
      }

      return localUri;
    },
    [carregarBacklog]
  );

  /**
   * CREATE: Adiciona um novo jogo ao Backlog, baixando a capa para o armazenamento
   * local via expo-file-system caso haja uma imagem remota disponível.
   */
  const adicionarJogo = useCallback(
    async (dadosJogo) => {
      setSalvando(true);
      setErro('');

      try {
        let coverUriLocal = dadosJogo.cover_uri || '';
        let urlRemota = dadosJogo.remote_cover_url || '';

        // Se o jogo veio do catálogo (rawg_id) mas a URL da capa ainda não foi obtida, consulta os detalhes
        if (!coverUriLocal && !urlRemota && dadosJogo.rawg_id) {
          try {
            const detalhes = await buscarDetalhesJogoNaRawg(dadosJogo.rawg_id);
            if (detalhes?.background_image) {
              urlRemota = detalhes.background_image;
            }
          } catch (apiError) {
            console.warn('[BacklogContext] Aviso ao obter URL da capa:', apiError);
          }
        }

        // Faz o download da imagem para o armazenamento local (expo-file-system)
        if (!coverUriLocal && urlRemota) {
          coverUriLocal = await salvarCapaLocal(
            urlRemota,
            dadosJogo.rawg_id || Date.now()
          );
        }

        const novoId = await inserirJogoBacklog({
          rawg_id: dadosJogo.rawg_id,
          title: dadosJogo.title,
          status: dadosJogo.status,
          rating: dadosJogo.rating,
          playtime: dadosJogo.playtime,
          achievements: dadosJogo.achievements || 0,
          review_text: dadosJogo.review_text,
          cover_uri: coverUriLocal,
          release_year: dadosJogo.release_year,
        });

        await carregarBacklog();
        return { sucesso: true, id: novoId };
      } catch (e) {
        console.error('[BacklogContext] Erro ao inserir jogo:', e);
        const mensagem = e.message || 'Não foi possível salvar a avaliação no banco local.';
        setErro(mensagem);
        throw new Error(mensagem);
      } finally {
        setSalvando(false);
      }
    },
    [carregarBacklog]
  );

  /**
   * UPDATE: Atualiza os dados de uma avaliação existente no SQLite,
   * preservando ou atualizando a URI local da capa.
   */
  const editarJogo = useCallback(
    async (id, dadosJogo) => {
      setSalvando(true);
      setErro('');

      try {
        let coverUriLocal = dadosJogo.cover_uri || '';

        if (!coverUriLocal && dadosJogo.remote_cover_url) {
          coverUriLocal = await salvarCapaLocal(
            dadosJogo.remote_cover_url,
            dadosJogo.rawg_id || id
          );
        }

        await atualizarJogoBacklog(id, {
          title: dadosJogo.title,
          status: dadosJogo.status,
          rating: dadosJogo.rating,
          playtime: dadosJogo.playtime,
          achievements: dadosJogo.achievements || 0,
          review_text: dadosJogo.review_text,
          cover_uri: coverUriLocal,
          release_year: dadosJogo.release_year,
        });

        await carregarBacklog();
        return { sucesso: true };
      } catch (e) {
        console.error('[BacklogContext] Erro ao atualizar jogo:', e);
        const mensagem = e.message || 'Não foi possível atualizar a avaliação.';
        setErro(mensagem);
        throw new Error(mensagem);
      } finally {
        setSalvando(false);
      }
    },
    [carregarBacklog]
  );

  /**
   * DELETE: Remove a avaliação do SQLite e limpa o arquivo de capa local correspondente.
   */
  const excluirJogo = useCallback(
    async (id, coverUri = '') => {
      setSalvando(true);
      setErro('');

      try {
        if (coverUri && coverUri.startsWith('file://')) {
          await removerCapaLocal(coverUri);
        }

        await deletarJogoBacklog(id);
        await carregarBacklog();
        return { sucesso: true };
      } catch (e) {
        console.error('[BacklogContext] Erro ao excluir jogo:', e);
        const mensagem = e.message || 'Não foi possível excluir a avaliação.';
        setErro(mensagem);
        throw new Error(mensagem);
      } finally {
        setSalvando(false);
      }
    },
    [carregarBacklog]
  );

  return (
    <BacklogContext.Provider
      value={{
        jogos,
        carregando,
        salvando,
        erro,
        carregarBacklog,
        adicionarJogo,
        editarJogo,
        excluirJogo,
        obterPreviewCapaCatalogo,
        baixarESalvarCapaLocal,
      }}
    >
      {children}
    </BacklogContext.Provider>
  );
};

export function useBacklog() {
  const ctx = useContext(BacklogContext);
  if (!ctx) {
    throw new Error('useBacklog precisa ser utilizado dentro de <BacklogProvider>.');
  }
  return ctx;
}
