import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles';

export default function ErrorMessage({ message, style }) {
  if (!message) return null;
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fdecea',
    borderLeftWidth: 3,
    borderLeftColor: colors.status.error,
    borderRadius: 4,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  text: {
    color: colors.status.error,
    fontSize: typography.fontSize.sm,
  },
});
