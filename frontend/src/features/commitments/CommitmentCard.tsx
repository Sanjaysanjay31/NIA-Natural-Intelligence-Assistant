import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { CommitmentItem } from './types';
import { CommitmentStatusBadge } from './CommitmentStatusBadge';
import { CommitmentSourceBadge } from './CommitmentSourceBadge';
import { CommitmentConfidence } from './CommitmentConfidence';

interface CommitmentCardProps {
  commitment: CommitmentItem;
  onOpenDetail?: (commitment: CommitmentItem) => void;
  onMarkCompleted?: (commitment: CommitmentItem) => void;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
  commitment,
  onOpenDetail,
  onMarkCompleted,
}) => {
  const isCompleted = commitment.status === 'COMPLETED';
  const isAtRisk = commitment.status === 'AT_RISK';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isAtRisk && styles.cardAtRisk,
        isCompleted && styles.cardCompleted,
      ]}
      onPress={() => onOpenDetail?.(commitment)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Commitment: ${commitment.action}, Status: ${commitment.status}`}
    >
      {/* Top Header: Badges & Owner */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <CommitmentStatusBadge status={commitment.status} />
          <CommitmentSourceBadge source={commitment.source} />
        </View>
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerText}>{commitment.owner}</Text>
        </View>
      </View>

      {/* Main Action Text */}
      <Text style={[styles.actionText, isCompleted && styles.actionCompleted]}>
        {commitment.action}
      </Text>

      {/* Deadline Info */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>DEADLINE</Text>
        <Text style={[styles.metaValue, !commitment.deadline && styles.metaValueMuted]}>
          {commitment.deadline ? `⏳ ${commitment.deadline}` : 'Open horizon'}
        </Text>
      </View>

      {/* Associated Context Tags: Event / Location */}
      {(commitment.relatedEventId || commitment.relatedLocation) && (
        <View style={styles.contextRow}>
          {commitment.relatedEventId && (
            <View style={styles.pill}>
              <Text style={styles.pillIcon}>📅</Text>
              <Text style={styles.pillText}>{commitment.relatedEventId}</Text>
            </View>
          )}
          {commitment.relatedLocation && (
            <View style={styles.pill}>
              <Text style={styles.pillIcon}>📍</Text>
              <Text style={styles.pillText}>{commitment.relatedLocation}</Text>
            </View>
          )}
        </View>
      )}

      {/* Confidence Meter */}
      <CommitmentConfidence confidence={commitment.confidence} />

      {/* Bottom Actions */}
      <View style={styles.footerRow}>
        <Text style={styles.detailHint}>Tap to view evidence & details →</Text>
        {!isCompleted && onMarkCompleted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={(e) => {
              e.stopPropagation();
              onMarkCompleted(commitment);
            }}
            accessibilityRole="button"
            accessibilityLabel="Mark Completed"
          >
            <Text style={styles.completeBtnText}>Mark Done ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardAtRisk: {
    borderColor: colors.border.glowAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  cardCompleted: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ownerBadge: {
    backgroundColor: colors.primary.purpleMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  ownerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary.neonPurple,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: typography.lineHeight.md,
    marginVertical: spacing.xs,
  },
  actionCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.muted,
    width: 68,
  },
  metaValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary.cyan,
  },
  metaValueMuted: {
    color: colors.text.muted,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: 4,
  },
  pillIcon: {
    fontSize: 10,
  },
  pillText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  detailHint: {
    fontSize: 11,
    color: colors.text.muted,
  },
  completeBtn: {
    backgroundColor: colors.accent.successMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent.successGreen,
  },
});
