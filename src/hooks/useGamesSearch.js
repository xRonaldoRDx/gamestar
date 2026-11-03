import { useCallback, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { buscarJogosNaRawg } from '../services/api';
import { filtrarJogosMockPorNome } from '../services/mockGames';

export function useGamesSearch() {
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const executarBusca = useCallback(async () => {
    const termoLimpo = termo.trim();
    if (!termoLimpo) {
      setErro('Digite o nome de um jogo para pesquisar.');
      return;
    }

    setCarregando(true);
    setErro('');
    setBuscaRealizada(true);

    try {
      // Se o Modo Offline (Mock) estiver ativo, realiza filtro local case-insensitive pelo nome real do jogo
      if (isMockMode) {
        const resultadosLocais = filtrarJogosMockPorNome(termoLimpo);
        setDados(resultadosLocais);
        return;
      }

      // Caso contrário, verifica a internet via NetInfo e consulta a API com AbortController
      const netState = await NetInfo.fetch();
      if (netState.isConnected === false || netState.isInternetReachable === false) {
        throw new Error(
          'Não foi possível conectar ao servidor de jogos. Verifique sua conexão com a internet.'
        );
      }

      const resposta = await buscarJogosNaRawg(termoLimpo);
      setDados(resposta);
    } catch (e) {
      setErro(
        e.message || 'Não foi possível conectar ao servidor de jogos.'
      );
      setDados([]);
    } finally {
      setCarregando(false);
    }
  }, [termo, isMockMode]);

  /**
   * Ativa silenciosamente o modo offline (isMockMode = true), limpa o estado de erro
   * e mantém a lista vazia aguardando que o usuário pesquise na barra de busca.
   */
  const ativarModoDemonstracao = useCallback(() => {
    setIsMockMode(true);
    setErro('');
    setCarregando(false);
    setDados([]);
    setBuscaRealizada(false);
  }, []);

  return {
    termo,
    setTermo,
    carregando,
    dados,
    erro,
    buscaRealizada,
    isMockMode,
    executarBusca,
    ativarModoDemonstracao,
  };
}
