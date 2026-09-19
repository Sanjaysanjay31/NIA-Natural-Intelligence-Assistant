import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface VoiceMemoErrorStateProps {
  errorMessage: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const VoiceMemoErrorState: React.FC<VoiceMemoErrorStateProps> = ({
  errorMessage,
  onRetry,
  onDismiss,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✕</Text>
      </View>

      <Text style={styles.title}>VoiceMemo Processing Error</Text>
      <Text style={styles.message}>{errorMessage}</Text>

      <View style={styles.btnRow}>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry Operation"
          >
            <Text style={styles.retryBtnText}>Retry Extraction</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss Error"
        >
          <Text style={styles.dismissBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent.dangerRed,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    color: colors.accent.dangerRed,
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  retryBtn: {
    backgroundColor: colors.accent.dangerRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryBtnText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  dismissBtn: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dismissBtnText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
