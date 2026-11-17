import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfileAvatar } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';

const UPLOAD_ERROR_MESSAGE = 'Não foi possível enviar a imagem. Tente novamente.';
const PERMISSION_MESSAGE = 'Permita o acesso à galeria para alterar sua foto de perfil.';

export function useAvatarUpload() {
  const { userId, updateAuthProfile, reloadProfile } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const pickAndUploadAvatar = useCallback(async () => {
    setAvatarError('');

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setAvatarError(PERMISSION_MESSAGE);
        Alert.alert('Permissão necessária', PERMISSION_MESSAGE);
        return null;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (pickerResult.canceled || !pickerResult.assets?.length) return null;

      setIsUploadingAvatar(true);
      const updatedProfile = await uploadProfileAvatar(userId, pickerResult.assets[0]);
      updateAuthProfile(updatedProfile);
      await reloadProfile();
      return updatedProfile;
    } catch (err) {
      const friendlyMessage = toFriendlyMessage(err, UPLOAD_ERROR_MESSAGE);
      setAvatarError(friendlyMessage);
      Alert.alert('Erro no upload', friendlyMessage);
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [userId, updateAuthProfile, reloadProfile]);

  return { isUploadingAvatar, avatarError, pickAndUploadAvatar };
}
