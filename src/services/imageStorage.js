import * as FileSystem from 'expo-file-system/legacy';

const COVERS_DIR = `${FileSystem.documentDirectory}covers/`;

/**
 * Garante que a pasta local para capas exista.
 */
async function garantirDiretorio() {
  const dirInfo = await FileSystem.getInfoAsync(COVERS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
  }
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
    await garantirDiretorio();

    const extensao = remoteUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const nomeArquivo = `cover_${gameId}_${Date.now()}.${extensao}`;
    const destinoLocal = `${COVERS_DIR}${nomeArquivo}`;

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, destinoLocal);

    if (downloadResult.status === 200) {
      return downloadResult.uri;
    }

    return '';
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
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (error) {
    console.warn('[ImageStorage] Aviso ao remover capa local:', error);
  }
}
