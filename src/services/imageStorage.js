import { Directory, File, Paths } from 'expo-file-system';

/**
 * Obtém e garante que o diretório local de capas exista (API moderna do Expo SDK 58).
 * @returns {Directory} Instância do diretório 'covers'
 */
function obterDiretorioCapas() {
  const diretorio = new Directory(Paths.document, 'covers');
  if (!diretorio.exists) {
    diretorio.create({ intermediates: true, idempotent: true });
  }
  return diretorio;
}

/**
 * Baixa uma imagem remota para o sistema de arquivos local do aparelho.
 * @param {string} remoteUrl URL da imagem remota
 * @param {number|string} gameId Identificador único do jogo
 * @returns {Promise<string>} Caminho local do arquivo (file://...) ou string vazia em caso de falha.
 */
export async function salvarCapaLocal(remoteUrl, gameId) {
  if (!remoteUrl || typeof remoteUrl !== 'string') {
    return '';
  }

  try {
    const diretorioCapas = obterDiretorioCapas();
    const extensao = remoteUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const nomeArquivo = `cover_${gameId}_${Date.now()}.${extensao}`;
    const arquivoDestino = new File(diretorioCapas, nomeArquivo);

    const arquivoBaixado = await File.downloadFileAsync(remoteUrl, arquivoDestino, {
      idempotent: true,
    });

    return arquivoBaixado?.uri || '';
  } catch (error) {
    console.error('[ImageStorage] Falha ao baixar capa localmente:', error);
    return '';
  }
}

/**
 * Remove a imagem salva no armazenamento local quando a avaliação é excluída.
 * @param {string} localUri Caminho do arquivo local
 */
export async function removerCapaLocal(localUri) {
  if (!localUri || !localUri.startsWith('file://')) {
    return;
  }

  try {
    const arquivo = new File(localUri);
    if (arquivo.exists) {
      arquivo.delete();
    }
  } catch (error) {
    console.warn('[ImageStorage] Aviso ao remover capa local:', error);
  }
}
