import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from './src/theme';
import { config } from './src/config/env';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config.appName}</Text>
      <Text style={styles.subtitle}>Reality-Verified Personal Intelligence Layer</Text>
      <Text style={styles.badge}>v{config.appVersion} | Shell Initialized</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    color: colors.primary.cyan,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.neonPurple,
  },
});
