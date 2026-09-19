import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { DriftResult } from '../contracts/reality';

interface EvidencePreviewCardProps {
  drift: DriftResult;
  onReviewEvidence?: () => void;
}

export const EvidencePreviewCard: React.FC<EvidencePreviewCardProps> = ({
  drift,
  onReviewEvidence,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{drift.entity}</Text>
        <View style={styles.driftBadge}>
          <Text style={styles.driftBadgeText}>{drift.driftType}</Text>
        </View>
      </View>

      <View style={styles.comparisonGrid}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>DIGITAL KNOWN</Text>
          <Text style={styles.valueText}>
            {drift.digital.location || JSON.stringify(drift.digital)}
          </Text>
          <Text style={styles.sourceBadge}>Source: {drift.digital.source || 'calendar'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.column}>
          <Text style={[styles.columnHeader, { color: colors.accent.amberDrift }]}>
            PHYSICAL OBSERVED
          </Text>
          <Text style={[styles.valueText, { color: colors.accent.amberDrift }]}>
            {drift.physical.location || JSON.stringify(drift.physical)}
          </Text>
          <Text style={styles.sourceBadge}>Source: {drift.physical.source || 'ocr'}</Text>
        </View>
      </View>

      {drift.explanation ? (
        <Text style={styles.explanationText}>{drift.explanation}</Text>
      ) : null}

      {onReviewEvidence && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onReviewEvidence}
          accessibilityRole="button"
          accessibilityLabel="Review Evidence"
        >
          <Text style={styles.actionBtnText}>Review Evidence ({Math.round(drift.confidence * 100)}% Confidence) →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.glowAmber,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  driftBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  driftBadgeText: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  comparisonGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xs,
  },
  columnHeader: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  valueText: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  sourceBadge: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  explanationText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginVertical: spacing.xs,
    lineHeight: 18,
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
});
