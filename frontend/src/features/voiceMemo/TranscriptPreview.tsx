import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface TranscriptPreviewProps {
  transcript: string;
  source?: string;
}

export const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  transcript,
  source = 'VOICE_MEMO',
}) => {
  if (!transcript) return null;

  const wordCount = transcript.trim().split(/\s+/).length;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>TRANSCRIPT EVIDENCE</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{source}</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>"{transcript}"</Text>

      <View style={styles.footerRow}>
        <Text style={styles.metaText}>{wordCount} words</Text>
        <Text style={styles.metaText}>Recorded via local device microphone</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.cyan,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: colors.primary.cyanMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: 10,
    color: colors.primary.cyan,
    fontWeight: 'bold',
  },
  bodyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: typography.lineHeight.md,
    marginVertical: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
