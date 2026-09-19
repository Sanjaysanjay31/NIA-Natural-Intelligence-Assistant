import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { AgentState } from '../contracts/enums';

interface AgentStateIndicatorProps {
  state: AgentState;
  statusMessage?: string;
}

export const AgentStateIndicator: React.FC<AgentStateIndicatorProps> = ({
  state,
  statusMessage,
}) => {
  const getIndicatorColor = () => {
    switch (state) {
      case AgentState.DRIFT:
        return colors.accent.amberDrift;
      case AgentState.ERROR:
        return colors.accent.dangerRed;
      case AgentState.SUCCESS:
      case AgentState.VERIFIED:
        return colors.accent.successGreen;
      case AgentState.LISTENING:
        return colors.primary.electricBlue;
      default:
        return colors.primary.cyan;
    }
  };

  const indicatorColor = getIndicatorColor();

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={[styles.dot, { backgroundColor: indicatorColor }]} />
        <Text style={[styles.stateText, { color: indicatorColor }]}>
          {state}
        </Text>
      </View>
      {statusMessage ? (
        <Text style={styles.messageText} numberOfLines={2}>
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  messageText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
