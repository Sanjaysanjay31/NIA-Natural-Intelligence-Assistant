import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface CommitmentEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const CommitmentEmptyState: React.FC<CommitmentEmptyStateProps> = ({
  title = 'No Commitments Tracked',
  description = 'No structured personal or interpersonal promises found in this view. Use VoiceMemo Pro or record a conversation to extract commitments.',
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>📋</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.md,
    maxWidth: 320,
  },
  actionBtn: {
    backgroundColor: colors.primary.cyan,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  actionBtnText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
});
