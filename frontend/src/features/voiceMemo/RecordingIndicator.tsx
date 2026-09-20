import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface RecordingIndicatorProps {
  durationSeconds: number;
  isRecording: boolean;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  durationSeconds,
  isRecording,
}) => {
  const formatTime = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.dot, isRecording ? styles.dotActive : styles.dotInactive]} />
        <Text style={styles.statusLabel}>
          {isRecording ? 'LIVE AUDIO CAPTURE' : 'CAPTURE PAUSED'}
        </Text>
      </View>

      <Text style={styles.timerText}>{formatTime(durationSeconds)}</Text>

      {/* Atmospheric waveform bars */}
      <View style={styles.waveformContainer}>
        {[0.4, 0.8, 0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 0.6, 0.4].map((heightScale, idx) => (
          <View
            key={idx}
            style={[
              styles.waveBar,
              {
                height: 8 + heightScale * (isRecording ? 24 : 6),
                backgroundColor: isRecording ? colors.primary.cyan : colors.text.muted,
                opacity: isRecording ? 0.9 : 0.4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  dotActive: {
    backgroundColor: colors.accent.dangerRed,
    shadowColor: colors.accent.dangerRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  dotInactive: {
    backgroundColor: colors.text.muted,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timerText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    marginVertical: spacing.xs,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    marginTop: spacing.xs,
  },
  waveBar: {
    width: 4,
    borderRadius: radii.xs,
  },
});
