import { Directory, File, Paths } from 'expo-file-system';

const COVERS_DIRECTORY_NAME = 'covers';

function getCoversDirectory() {
  const directory = new Directory(Paths.document, COVERS_DIRECTORY_NAME);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

export async function saveLocalCover(remoteUrl, gameId) {
  if (!remoteUrl || typeof remoteUrl !== 'string') {
    return '';
  }

  try {
    const coversDirectory = getCoversDirectory();
    const extension = remoteUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `cover_${gameId}_${Date.now()}.${extension}`;
    const targetFile = new File(coversDirectory, fileName);

    const downloadedFile = await File.downloadFileAsync(remoteUrl, targetFile, {
      idempotent: true,
    });

    return downloadedFile?.uri || '';
  } catch (error) {
    console.error('[ImageStorage] Failed to download local cover:', error);
    return '';
  }
}

export async function deleteLocalCover(localUri) {
  if (!localUri || !localUri.startsWith('file://')) {
    return;
  }

  try {
    const file = new File(localUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('[ImageStorage] Failed to delete local cover:', error);
  }
}
