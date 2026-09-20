import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface CommitmentConfidenceProps {
  confidence: number;
}

export const CommitmentConfidence: React.FC<CommitmentConfidenceProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);

  let tier = 'HIGH';
  let barColor: string = colors.primary.cyan;
  if (percentage < 60) {
    tier = 'PROVISIONAL';
    barColor = colors.accent.amberDrift;
  } else if (percentage < 85) {
    tier = 'MODERATE';
    barColor = colors.primary.electricBlue;
  }

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.label}>EXTRACTION CONFIDENCE</Text>
        <Text style={[styles.percentage, { color: barColor }]}>
          {percentage}% ({tier})
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  percentage: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  track: {
    height: 4,
    backgroundColor: colors.background.elevated,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
});
