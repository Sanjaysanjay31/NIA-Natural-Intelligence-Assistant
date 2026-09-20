import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { CommitmentStatus } from './types';

interface CommitmentStatusBadgeProps {
  status: CommitmentStatus;
}

const STATUS_CONFIG: Record<
  CommitmentStatus,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'PENDING',
    icon: '⏳',
    bg: colors.primary.cyanMuted,
    text: colors.primary.cyan,
    border: colors.border.focus,
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    icon: '⚡',
    bg: 'rgba(59, 130, 246, 0.18)',
    text: colors.primary.electricBlue,
    border: 'rgba(59, 130, 246, 0.4)',
  },
  COMPLETED: {
    label: 'COMPLETED',
    icon: '✓',
    bg: colors.accent.successMuted,
    text: colors.accent.successGreen,
    border: 'rgba(16, 185, 129, 0.4)',
  },
  CANCELLED: {
    label: 'CANCELLED',
    icon: '⊘',
    bg: 'rgba(148, 163, 184, 0.12)',
    text: colors.text.muted,
    border: colors.border.subtle,
  },
  AT_RISK: {
    label: 'AT RISK',
    icon: '⚠',
    bg: colors.accent.amberMuted,
    text: colors.accent.amberDrift,
    border: colors.border.glowAmber,
  },
};

export const CommitmentStatusBadge: React.FC<CommitmentStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: 4,
  },
  icon: {
    fontSize: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
