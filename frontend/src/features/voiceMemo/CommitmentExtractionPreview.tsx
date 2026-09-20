import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { ExtractedCommitmentItem } from './types';

interface CommitmentExtractionPreviewProps {
  commitments: ExtractedCommitmentItem[];
  onSave: (commitment: ExtractedCommitmentItem) => void;
  onDiscard: () => void;
}

export const CommitmentExtractionPreview: React.FC<CommitmentExtractionPreviewProps> = ({
  commitments,
  onSave,
  onDiscard,
}) => {
  if (!commitments || commitments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Commitments Detected</Text>
        <Text style={styles.emptySubtitle}>
          The transcript did not contain explicit personal or interpersonal commitments.
        </Text>
        <TouchableOpacity
          style={styles.discardBtn}
          onPress={onDiscard}
          accessibilityRole="button"
          accessibilityLabel="Dismiss Memo"
        >
          <Text style={styles.discardBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EXTRACTED COMMITMENTS ({commitments.length})</Text>
        <Text style={styles.sectionSubtitle}>Verified via NIA Deterministic Extraction</Text>
      </View>

      {commitments.map((cmt) => {
        const confidencePct = Math.round(cmt.confidence * 100);
        return (
          <View key={cmt.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerText}>Responsible: {cmt.owner}</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{confidencePct}% Confidence</Text>
              </View>
            </View>

            <Text style={styles.actionTitle}>{cmt.action}</Text>

            {cmt.deadline ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DEADLINE</Text>
                <Text style={styles.detailValue}>{cmt.deadline}</Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DEADLINE</Text>
                <Text style={[styles.detailValue, { color: colors.text.muted }]}>Open / None specified</Text>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => onSave(cmt)}
                accessibilityRole="button"
                accessibilityLabel="Save Commitment"
              >
                <Text style={styles.saveBtnText}>Save Commitment ✓</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.discardBtn}
                onPress={onDiscard}
                accessibilityRole="button"
                accessibilityLabel="Discard Commitment"
              >
                <Text style={styles.discardBtnText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.cyan,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.focus,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ownerBadge: {
    backgroundColor: colors.primary.purpleMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  ownerText: {
    color: colors.primary.neonPurple,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  confidenceBadge: {
    backgroundColor: colors.primary.cyanMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  confidenceText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: 'bold',
    width: 80,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.cyan,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary.cyan,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  discardBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  discardBtnText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: typography.fontSize.sm,
  },
  emptyContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
