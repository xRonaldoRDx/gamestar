import React from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * Keeps inputs visible above the keyboard on both platforms.
 *
 * Expo apps are edge-to-edge on Android, so the window no longer resizes for the
 * keyboard and 'height' does nothing useful there: 'padding' is used everywhere.
 * The real header height (0 on screens without a header) replaces hardcoded offsets,
 * which drift between devices and font scales.
 */
export default function KeyboardAwareView({ style, children }) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={[styles.flex, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
