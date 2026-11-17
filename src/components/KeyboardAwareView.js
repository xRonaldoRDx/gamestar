import React from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

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
