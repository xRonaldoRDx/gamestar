import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initDB, listarJogosBacklog } from '../database/database';

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

  return (
    <BacklogContext.Provider
      value={{
        jogos,
        carregando,
        erro,
        carregarBacklog,
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
