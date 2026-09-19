import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

interface SettingsEntryProps {
  backendTarget?: string;
  resolvedUrl?: string;
  onPress: () => void;
}

export const SettingsEntry: React.FC<SettingsEntryProps> = ({
  backendTarget = 'local_lan',
  resolvedUrl = 'http://localhost:8000',
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Backend targeting settings"
    >
      <View style={styles.left}>
        <View style={styles.statusDot} />
        <Text style={styles.targetLabel}>{backendTarget.toUpperCase()}</Text>
        <Text style={styles.urlLabel} numberOfLines={1}>
          {resolvedUrl}
        </Text>
      </View>
      <Text style={styles.gearIcon}>⚙</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.successGreen,
    marginRight: 6,
  },
  targetLabel: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    marginRight: 8,
  },
  urlLabel: {
    color: colors.text.muted,
    fontSize: 10,
    flex: 1,
  },
  gearIcon: {
    color: colors.text.secondary,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
});
