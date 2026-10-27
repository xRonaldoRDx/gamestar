import { useState } from 'react';
import { buscarJogosNaRawg } from '../services/api';

export function useGamesSearch() {
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  async function executarBusca() {
    if (!termo.trim()) {
      setErro('Digite o nome de um jogo para pesquisar.');
      return;
    }

    setCarregando(true);
    setErro('');
    setBuscaRealizada(true);

    try {
      const resposta = await buscarJogosNaRawg(termo);
      setDados(resposta);
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar os jogos do catálogo.');
      setDados([]);
    } finally {
      setCarregando(false);
    }
  }

  return {
    termo,
    setTermo,
    carregando,
    dados,
    erro,
    buscaRealizada,
    executarBusca,
  };
}
