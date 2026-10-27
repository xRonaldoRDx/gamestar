import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  atualizarCapaLocalBacklog,
  initDB,
  listarJogosBacklog,
} from '../database/database';
import { salvarCapaLocal } from '../services/imageStorage';

export const BacklogContext = createContext(null);

export const BacklogProvider = ({ children }) => {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarBacklog = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const lista = await listarJogosBacklog();
      setJogos(lista);
    } catch (e) {
      console.error('Erro ao carregar backlog:', e);
      setErro(e.message || 'Não foi possível carregar os jogos do banco local.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    initDB()
      .then(() => carregarBacklog())
      .catch((e) => {
        console.error('Erro ao inicializar banco:', e);
        setErro(e.message || 'Falha ao inicializar o banco SQLite.');
        setCarregando(false);
      });
  }, [carregarBacklog]);

  /**
   * Orquestra o download de uma capa remota para o sistema de arquivos local
   * via expo-file-system e retorna a URI local (file://...).
   * Caso o id do registro no SQLite seja informado, persiste a URI no banco.
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

  return (
    <BacklogContext.Provider
      value={{
        jogos,
        carregando,
        erro,
        carregarBacklog,
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
