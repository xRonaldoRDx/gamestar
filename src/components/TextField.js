import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

const PASSWORD_TOGGLE_WIDTH = 48;

/**
 * Labeled text input. With `isPassword`, the text starts hidden and an eye
 * button lets the user reveal what they typed.
 */
export default function TextField({ label, hint, multiline = false, isPassword = false, style, ...rest }) {
  const { colors, spacing, radius } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {label ? (
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          accessibilityLabel={label}
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize={isPassword ? 'none' : undefined}
          autoCorrect={isPassword ? false : undefined}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
            },
            isPassword && { paddingRight: PASSWORD_TOGGLE_WIDTH },
            multiline && styles.multiline,
          ]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    width: PASSWORD_TOGGLE_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
